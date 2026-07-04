// Excerpt — the ADBMS driver's four dedicated FreeRTOS tasks, pulled from
// UBC Formula Electric's BMS tasks.cpp. The non-ADBMS tasks (CAN, charger,
// watchdog, kernel init) are omitted here for clarity; the full file is
// available on GitHub.

#include "tasks.h"
#include "jobs.hpp"

#include "io_time.hpp"
#include "hw_rtosTaskHandler.hpp"

// Each ADBMS acquisition path runs in its own task at its own period, so a
// slow thermistor sweep never blocks fast cell-voltage sampling.
[[noreturn]] static void tasks_runAdbmsVoltages(void *arg);
[[noreturn]] static void tasks_runAdbmsConfigs(void *arg);
[[noreturn]] static void tasks_runAdbmsAux(void *arg);
[[noreturn]] static void tasks_runAdbmsCellOwc(void *arg);

static hw::rtos::StaticTask::StaticTaskStack<1024 * 3> TaskAdbmsVoltagesStack;
static hw::rtos::StaticTask::StaticTaskStack<1024 * 3> TaskAdbmsConfigsStack;
static hw::rtos::StaticTask::StaticTaskStack<1024 * 3> TaskAdbmsAuxStack;
static hw::rtos::StaticTask::StaticTaskStack<1024 * 3> TaskAdbmsCellOwcStack;

static hw::rtos::StaticTask
    TaskAdbmsVoltages(osPriorityNormal, "TaskAdbmsVoltages", tasks_runAdbmsVoltages, TaskAdbmsVoltagesStack);
static hw::rtos::StaticTask
    TaskAdbmsConfigs(osPriorityHigh, "TaskAdbmsConfigs", tasks_runAdbmsConfigs, TaskAdbmsConfigsStack);
static hw::rtos::StaticTask TaskAdbmsAux(osPriorityNormal, "TaskAdbmsAux", tasks_runAdbmsAux, TaskAdbmsAuxStack);
static hw::rtos::StaticTask
    TaskAdbmsCellOwc(osPriorityNormal, "TaskAdbmsCellOwc", tasks_runAdbmsCellOwc, TaskAdbmsCellOwcStack);

void tasks_runAdbmsVoltages(void *arg)
{
    const uint32_t period_ms   = 500U;
    uint32_t       start_ticks = osKernelGetTickCount();

    forever
    {
        jobs_runAdbmsVoltages_tick();
        start_ticks += period_ms;
        osDelayUntil(start_ticks);
    }
}

void tasks_runAdbmsConfigs(void *arg)
{
    constexpr uint32_t period_ms   = 100U;
    uint32_t           start_ticks = osKernelGetTickCount();

    forever
    {
        jobs_runAdbmsConfigs_tick();
        start_ticks += period_ms;
        osDelayUntil(start_ticks);
    }
}

void tasks_runAdbmsAux(void *arg)
{
    const uint32_t period_ms   = 1200U;
    uint32_t       start_ticks = osKernelGetTickCount();

    forever
    {
        jobs_runAdbmsAux_tick();
        start_ticks += period_ms;
        osDelayUntil(start_ticks);
    }
}

void tasks_runAdbmsCellOwc(void *arg)
{
    const uint32_t period_ms   = 1000U;
    uint32_t       start_ticks = osKernelGetTickCount();

    forever
    {
        jobs_runAdbmsCellOwc_tick();
        start_ticks += period_ms;
        osDelayUntil(start_ticks);
    }
}

// The four ADBMS tasks are launched from BMS_StartAllTasks() alongside the
// CAN, charger, and watchdog tasks:
//
//     TaskAdbmsVoltages.start();
//     TaskAdbmsConfigs.start();
//     TaskAdbmsAux.start();
//     TaskAdbmsCellOwc.start();
