# pranay-o.github.io

Personal portfolio site for Pranay Oza — embedded systems engineer.

Built as a static HTML/CSS/JS site with no build step. Hosted on GitHub Pages.

**Live:** https://pranay-o.github.io

## Local preview

The tabs are real routes (`/` for Experience, `/projects/`, `/resume/`), so preview through a static server rather than opening the files directly:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Structure

- `content.js` — all Experience / Projects / Resume content and header links. Edit this to update the site.
- `site.js` — renders the header and the three tabs from `content.js`
- `index.html` (Experience), `projects/index.html`, `resume/index.html` — page shells for the three tabs
- `resume.html` — redirects old links to the Resume tab
- `*.html` at the root — long-form project write-ups (linked from Projects)
- `adbms-viewer.js`, `boot-viewer.js` — source viewers on the ADBMS and bootloader write-ups
- `styles.css` — design tokens + layout
- `assets/` — images, 3D models, PDFs, and bundled ADBMS source

## Updating the resume

The Resume tab shows the resume page itself, built from LaTeX. Edit `assets/Resume_Pranay.tex`, then run:

```sh
scripts/build-resume.sh   # needs pdflatex (MacTeX) and poppler (brew install poppler)
```

It rebuilds `assets/Resume_Pranay.pdf` (the file people open and download) and `assets/Resume_Pranay.svg` (the page image shown on the tab).
