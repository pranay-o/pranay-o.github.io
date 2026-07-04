// Excerpt — the ADBMS driver's periodic "job" ticks, pulled from UBC Formula
// Electric's BMS jobs.cpp. Each tick below is driven by the matching FreeRTOS
// task in tasks.cpp. The non-ADBMS jobs (CAN plumbing, jobs_init, and the
// generic 1 Hz / 100 Hz / 1 kHz ticks) are omitted here; the full file is on
// GitHub.

#include "jobs.hpp"
#include "util_errorCodes.hpp"

#include <algorithm>
#include <ranges>

#include "app_segments.hpp"
#include "io_semaphore.hpp"
#include "io_time.hpp"
#include "io_notify.hpp"

using io::adbms::Cells;
using io::adbms::OpenWireSwitch;
using io::adbms::Segments;
using io::adbms::ThermGpios;
using io::adbms::Therms;

// Raised once every segment's config has synced, so the acquisition ticks
// below don't start talking to the chain before it's configured.
static io::notify::Notifier sync_done;

void jobs_runAdbmsConfigs_tick()
{
    bool all_segments_ok = true;

    const Segments<result<bool>> sync_res = app::segments::config::sync();
    {
        const io::unique_semaphore h{ health_lock };
        for (size_t seg_num = 0; seg_num < NUM_SEGMENTS; seg_num++)
        {
            const auto &seg_res = sync_res[seg_num];
            app::segments::health::setOrReset(seg_num, app::segments::health::ErrorBit::CONFIG, not seg_res);
            if (!seg_res)
            {
                all_segments_ok = false;
                LOG_ERROR(
                    "Failed to sync config on segment %d: %s", (int)seg_num, error_code_to_string(seg_res.error()));
                continue;
            }
            if (!seg_res.value())
            {
                all_segments_ok = false;
                LOG_ERROR(
                    "Failed to sync config on segment %d: ADBMS config did not match in-memory config", (int)seg_num);
            }
        }
    }

    std::array<std::bitset<app::segments::health::NUM_HEALTH_BITS>, MAX_NUM_SEGMENTS> health;
    {
        const io::unique_semaphore h{ health_lock };
        health = app::segments::health::getAll();
    }

    app::segments::broadcast::segmentHealthError(health);

    if (all_segments_ok)
    {
        LOG_INFO("All segments reachable and synced! Notifying...");
        sync_done.notify();
    }
}

void jobs_runAdbmsVoltages_tick()
{
    sync_done.wait();
    LOG_INFO("Starting voltage readings");
    LOG_IF_ERR(io::adbms::clear::cell());

    const result<void> cell_voltage_start_ok = io::adbms::command::startCellsAdc();
    {
        const io::unique_semaphore h{ health_lock };
        app::segments::health::setOrResetAll(
            app::segments::health::ErrorBit::CELL_ADC_START, not cell_voltage_start_ok);
    }
    if (not cell_voltage_start_ok)
    {
        app::segments::broadcast::debug::cellVoltages(Cells<result<float>>{}, cell_voltage_start_ok);
        return;
    }

    io::time::delay(CELL_CONV_TIME_MS);

    const result<void> cell_voltage_poll_ok = io::adbms::command::pollCellsAdc();
    {
        const io::unique_semaphore h{ health_lock };
        app::segments::health::setOrResetAll(app::segments::health::ErrorBit::AUX_ADC_POLL, not cell_voltage_poll_ok);
    }
    if (not cell_voltage_poll_ok)
    {
        app::segments::broadcast::debug::cellVoltages(Cells<result<float>>{}, cell_voltage_poll_ok);
        return;
    }

    Cells<result<float>> cell_voltages = app::segments::conversion::cellVoltage();
    {
        const io::unique_semaphore h{ health_lock };
        for (size_t seg = 0; seg < NUM_SEGMENTS; seg++)
        {
            const bool seg_err = std::ranges::any_of(cell_voltages[seg], [](const result<float> &r) { return not r; });
            app::segments::health::setOrReset(seg, app::segments::health::ErrorBit::CELL_VOLTAGE, seg_err);
        }
    }

    app::segments::CellParam<float> max_voltage;
    app::segments::CellParam<float> min_voltage;
    {
        const io::unique_semaphore s{ shared_lock };
        app::segments::shared::setVoltageStats(cell_voltages);
        max_voltage = app::segments::shared::getMaxCellVoltage();
        min_voltage = app::segments::shared::getMinCellVoltage();
    }

    app::segments::health::Snapshot health;
    {
        const io::unique_semaphore h{ health_lock };
        health = app::segments::health::getAll();
    }

    app::segments::broadcast::segmentHealthError(health);
    app::segments::broadcast::cellVoltageStats(min_voltage, max_voltage);
    app::segments::broadcast::debug::cellVoltages(cell_voltages, result<void>{});
}

void jobs_runAdbmsCellOwc_tick()
{
    sync_done.wait();
    LOG_INFO("Starting cell open wire check");

    std::array<Cells<result<float>>, static_cast<size_t>(OpenWireSwitch::CHANNEL_COUNT)> owc_voltages;

    for (const OpenWireSwitch channel : { OpenWireSwitch::ODD_CHANNELS, OpenWireSwitch::EVEN_CHANNELS })
    {
        LOG_IF_ERR(io::adbms::clear::secondaryCell());

        const auto owc_voltage_start_ok = io::adbms::command::owcCells(channel);
        {
            const io::unique_semaphore h{ health_lock };
            app::segments::health::setOrResetAll(
                app::segments::health::ErrorBit::OWC_ADC_START, not owc_voltage_start_ok);
        }
        if (not owc_voltage_start_ok)
        {
            app::segments::broadcast::debug::cellOwcOk(Cells<result<bool>>{}, owc_voltage_start_ok);
            return;
        }

        io::time::delay(SECONDARY_CELL_CONV_TIME_MS);

        const auto owc_voltage_poll_ok = io::adbms::command::pollSecondaryCellsAdc();
        {
            const io::unique_semaphore h{ health_lock };
            app::segments::health::setOrResetAll(
                app::segments::health::ErrorBit::AUX_ADC_POLL, not owc_voltage_poll_ok);
        }
        if (not owc_voltage_poll_ok)
        {
            app::segments::broadcast::debug::cellOwcOk(Cells<result<bool>>{}, owc_voltage_poll_ok);
            return;
        }

        owc_voltages[static_cast<size_t>(channel)] = app::segments::conversion::cellOwcVoltages();
    }

    {
        const io::unique_semaphore h{ health_lock };
        for (size_t seg = 0; seg < NUM_SEGMENTS; seg++)
        {
            bool seg_err = false;
            for (const OpenWireSwitch channel : { OpenWireSwitch::ODD_CHANNELS, OpenWireSwitch::EVEN_CHANNELS })
            {
                seg_err = seg_err || std::ranges::any_of(
                                         owc_voltages[static_cast<size_t>(channel)][seg],
                                         [](const result<float> &r) { return not r; });
            }
            app::segments::health::setOrReset(seg, app::segments::health::ErrorBit::CELL_OWC_VOLTAGE, seg_err);
        }
    }

    const Cells<result<bool>> cell_owc_ok = app::segments::calculate::cellOwcOk(owc_voltages);

    {
        io::unique_semaphore s{ shared_lock };
        app::segments::shared::setCellOwcOk(cell_owc_ok);
    }

    app::segments::health::Snapshot health;
    {
        const io::unique_semaphore h{ health_lock };
        health = app::segments::health::getAll();
    }

    app::segments::broadcast::segmentHealthError(health);
    app::segments::broadcast::debug::cellOwcOk(cell_owc_ok, result<void>{});
}

void jobs_runAdbmsAux_tick()
{
    sync_done.wait();
    LOG_INFO("Starting AUX readings");
    LOG_IF_ERR(io::adbms::clear::flags());

    std::array<ThermGpios<result<float>>, static_cast<size_t>(app::segments::ThermistorMux::THERMISTOR_MUX_COUNT)>
        therm_voltages;

    for (const app::segments::ThermistorMux mux :
         { app::segments::ThermistorMux::THERMISTOR_MUX_0_7, app::segments::ThermistorMux::THERMISTOR_MUX_8_13 })
    {
        app::segments::config::setThermistorConfig(mux);
        sync_done.notify();
        io::time::delay(100); // todo: expirement with this
        LOG_IF_ERR(io::adbms::clear::aux());

        const auto therm_voltage_start_ok = io::adbms::command::startAuxAdc();
        {
            const io::unique_semaphore h{ health_lock };
            app::segments::health::setOrResetAll(
                app::segments::health::ErrorBit::AUX_ADC_START, not therm_voltage_start_ok);
        }
        if (not therm_voltage_start_ok)
        {
            app::segments::broadcast::debug::thermTemps(Therms<result<float>>{}, therm_voltage_start_ok);
            app::segments::broadcast::debug::thermOwcOk(Therms<result<bool>>{}, therm_voltage_start_ok);
            return;
        }

        io::time::delay(AUX_CONV_TIME_MS);

        const auto therm_voltage_poll_ok = io::adbms::command::pollAuxAdc();
        {
            const io::unique_semaphore h{ health_lock };
            app::segments::health::setOrResetAll(
                app::segments::health::ErrorBit::AUX_ADC_POLL, not therm_voltage_poll_ok);
        }
        if (not therm_voltage_poll_ok)
        {
            app::segments::broadcast::debug::thermTemps(Therms<result<float>>{}, therm_voltage_poll_ok);
            app::segments::broadcast::debug::thermOwcOk(Therms<result<bool>>{}, therm_voltage_poll_ok);
            return;
        }

        therm_voltages[static_cast<size_t>(mux)] = app::segments::conversion::thermVoltage();
    }

    const Segments<result<float>>              seg_voltages = app::segments::conversion::segVoltage();
    const Segments<io::adbms::StatusGroupsRes> status       = io::adbms::read::status();

    const Therms<result<float>> therm_temps  = app::segments::calculate::thermTemps(therm_voltages);
    const Therms<result<bool>>  therm_owc_ok = app::segments::calculate::thermOwcOk(therm_voltages);

    result<float>                      pack_voltage;
    app::segments::CellParam<float>    max_temp;
    app::segments::CellParam<float>    min_temp;
    app::segments::SegmentParam<float> max_voltage;
    app::segments::SegmentParam<float> min_voltage;
    {
        io::unique_semaphore s{ shared_lock };
        app::segments::shared::setThermistorOwcOk(therm_owc_ok);
        app::segments::shared::setTemperatureStats(therm_temps);
        app::segments::shared::setSegmentVoltageStats(seg_voltages);
        pack_voltage = app::segments::shared::getPackVoltage();
        max_temp     = app::segments::shared::getMaxCellTemperature();
        min_temp     = app::segments::shared::getMinCellTemperature();
        max_voltage  = app::segments::shared::getMaxSegmentVoltage();
        min_voltage  = app::segments::shared::getMinSegmentVoltage();
    }

    app::segments::health::Snapshot health;
    {
        const io::unique_semaphore h{ health_lock };
        health = app::segments::health::getAll();
    }

    app::segments::broadcast::segmentHealthError(health);
    app::segments::broadcast::packVoltage(pack_voltage);
    app::segments::broadcast::cellTempStats(min_temp, max_temp);
    app::segments::broadcast::segmentVoltageStats(min_voltage, max_voltage);

    app::segments::broadcast::debug::thermTemps(therm_temps, result<void>{});
    app::segments::broadcast::debug::thermOwcOk(therm_owc_ok, result<void>{});
    app::segments::broadcast::debug::segVoltages(seg_voltages);
    app::segments::broadcast::debug::status(status);
}
