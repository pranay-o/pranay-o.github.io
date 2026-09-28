#!/bin/sh
# Rebuild the resume PDF and the page image shown on the Resume tab
# from assets/Resume_Pranay.tex. Needs pdflatex (MacTeX / TeX Live)
# and pdftocairo + pdfinfo (poppler: `brew install poppler`).
set -eu
cd "$(dirname "$0")/.."

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# Two passes so hyperref's bookmarks settle.
for pass in 1 2; do
  pdflatex -interaction=nonstopmode -halt-on-error -output-directory "$tmp" \
    assets/Resume_Pranay.tex > "$tmp/build.log" || { tail -n 30 "$tmp/build.log"; exit 1; }
done

cp "$tmp/Resume_Pranay.pdf" assets/Resume_Pranay.pdf
pdftocairo -svg -f 1 -l 1 assets/Resume_Pranay.pdf assets/Resume_Pranay.svg

pages=$(pdfinfo assets/Resume_Pranay.pdf | awk '/^Pages:/ { print $2 }')
[ "$pages" = 1 ] || echo "warning: the resume is $pages pages; the site only shows page 1" >&2
echo "Built assets/Resume_Pranay.pdf and assets/Resume_Pranay.svg"
