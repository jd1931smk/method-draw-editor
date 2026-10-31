# CLAUDE.md

Fork of [Method Draw](https://github.com/methodofaction/Method-Draw) (a browser SVG editor, MIT license) customized for the CopyCat ACT project. Plain JS + jQuery, no framework, no bundler beyond gulp.

## Commands

```bash
# Dev: serve the source directly, no build needed
cd src && python3 -m http.server 8000

# Production build -> dist/ (concat/minify/cache-bust via gulpfile.js)
npm install
npx gulp build
```

- Deploy: Netlify runs `npm install && npx gulp build` and publishes `dist/` (`netlify.toml`, Node 18). `dist/` is gitignored.
- Tests: QUnit HTML pages in `test/` (open `test/all_tests.html` in a browser). `npm test` is not wired up.

## Layout

- `src/index.html` — entry point; `src/js/` — editor modules (`svgcanvas.js` is the core canvas engine, `method-draw.js` the editor bootstrap and API, `editor.js`, `modals.js`, `start.js`, etc.); `src/js/lib/` — vendored libraries (don't edit).
- `src/extensions/`, `src/shapelib/` — editor extensions and shape library.
- `gulpfile.js` — build tasks (`css`, `js`, `index`, `cache`, `manifest`, `images`, `extensions`, `shapelib`, `canvg`, combined in `build`). New JS/CSS files must be referenced in `src/index.html` so the useref build picks them up.

## CopyCat integration (the main fork change)

- CopyCat opens this editor in a new window. The editor returns the drawing with
  `window.opener.postMessage({ type: "RETURN_SVG", content: <svg string>, source: "method-draw" }, "*")`
  (see `src/js/start.js` and the "Send back to CopyCat" button in `src/js/modals.js`).
- It always copies the SVG to the clipboard as well, as a fallback when there is no opener.
- Get SVG text with `svgCanvas.getSvgString()` (XMLSerializer path). Recent commits fixed View Source hangs/crashes on large or marker-heavy SVGs; avoid putting huge SVG strings into textareas or selecting them.
- The consuming side lives in `~/Code/tutoring/actcopycat` / `actcopycattrue`. Keep the message shape stable.
