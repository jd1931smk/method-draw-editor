// globals
const svgCanvas = new $.SvgCanvas(document.getElementById("svgcanvas"));
const editor = new MD.Editor();
const state = new State();

// Above this size, dumping SVG into a <textarea> freezes Chrome (esp. after edits).
const SVG_SOURCE_TEXTAREA_LIMIT = 80000;

editor.modal = {
  about: new MD.Modal({
    html: `
      <h1>About this application</h1>
      <p>Method Draw is a simple <a href="https://github.com/methodofaction/Method-Draw">open source</a> vector drawing application. Method Draw was forked from <a href="https://github.com/SVG-Edit/svgedit">SVG-Edit</a> several years ago with the goal of improving and modernizing the interface.</p>
      <p>At this time (2021), the author (<a href="http://method.ac/writing">Mark MacKay</a>) is working on improving stability and improving the codebase, which contains a lot of legacy practices. The goal is to create a vector editor suitable for simple graphic design tasks.</p>
      `
  }),
  source: new MD.Modal({
    html: `
      <div id="svg_source_editor">
        <div id="svg_source_overlay" class="overlay"></div>
        <div id="svg_source_container">
          <form>
            <textarea id="svg_source_textarea" spellcheck="false"></textarea>
          </form>
          <div id="tool_source_back" class="toolbar_button">
            <button id="tool_source_cancel" class="cancel">Cancel</button>
            <button id="tool_source_load" class="ok" type="button">Load full source</button>
            <button id="tool_source_copy" class="ok" type="button">Copy SVG</button>
            <button id="tool_source_return" class="ok" type="button">Send back to CopyCat</button>
            <button id="tool_source_save" class="ok">Apply Changes</button>
          </div>
        </div>
    </div>`,
    js: function(el){
      el.children[0].classList.add("modal-item-source");
      const ta = el.querySelector("#svg_source_textarea");
      const loadBtn = el.querySelector("#tool_source_load");

      // Authoritative SVG for Copy / Send when textarea is deferred or loading.
      this.cachedSvg = "";
      this.deferred = false;

      function largeSourcePlaceholder(svg) {
        const kb = Math.round((svg.length / 1024) * 10) / 10;
        return [
          `/* Large SVG (${kb} KB) — full XML was NOT loaded into this box.`,
          `   Putting it in a textarea freezes Chrome on big Luna diagrams.`,
          ``,
          `   Use “Copy SVG” or “Send back to CopyCat” — those work from memory.`,
          `   Only click “Load full source” if you really need to edit the raw XML. */`,
          ``,
          svg.slice(0, 400).replace(/\*\//g, "*∕"),
          ``,
          `/* … truncated preview … */`
        ].join("\n");
      }

      this.setSourceSvg = function(svg, opts) {
        opts = opts || {};
        this.cachedSvg = svg || "";
        const forceFull = !!opts.forceFull;
        const tooBig = !forceFull && this.cachedSvg.length > SVG_SOURCE_TEXTAREA_LIMIT;
        this.deferred = tooBig;
        loadBtn.style.display = tooBig ? "inline-block" : "none";
        ta.readOnly = tooBig;
        if (tooBig) {
          ta.value = largeSourcePlaceholder(this.cachedSvg);
        } else {
          ta.value = this.cachedSvg;
        }
        ta.scrollTop = 0;
      }.bind(this);

      function getSourceText() {
        if (editor.modal.source.deferred) {
          return editor.modal.source.cachedSvg || "";
        }
        return ta.value;
      }

      async function copySourceSvg() {
        const text = getSourceText();
        if (!text) {
          $.alert("No SVG to copy.");
          return;
        }
        try {
          await navigator.clipboard.writeText(text);
          $.alert("SVG copied to clipboard.");
          return;
        } catch (err) {
          console.warn("clipboard.writeText failed", err);
        }
        // Never textarea.select() on large strings — that freezes the tab.
        // Fall back to a download instead.
        try {
          const blob = new Blob([text], { type: "image/svg+xml;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "diagram.svg";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
          $.alert("Clipboard blocked — downloaded diagram.svg instead.");
        } catch (err2) {
          $.alert("Could not copy SVG. Try Send back to CopyCat instead.");
        }
      }

      function returnSourceSvg() {
        const text = getSourceText();
        if (!window.opener || window.opener.closed) {
          copySourceSvg();
          $.alert("No opener window found. SVG was copied/downloaded instead — paste it into the SVG textarea on the CopyCat page.");
          return;
        }
        try {
          window.opener.postMessage({
            type: "RETURN_SVG",
            content: text,
            source: "method-draw"
          }, "*");
          $.alert("SVG sent back to CopyCat. You can close this editor tab.");
        } catch (err) {
          console.error(err);
          copySourceSvg();
          $.alert("Could not message the opener. SVG was copied/downloaded instead.");
        }
      }

      loadBtn.addEventListener("click", function() {
        if (!editor.modal.source.cachedSvg) return;
        if (!confirm("Loading the full SVG into this box can freeze the browser for large diagrams. Continue?")) {
          return;
        }
        loadBtn.disabled = true;
        loadBtn.textContent = "Loading…";
        // Yield so the UI can paint before the freeze-prone assignment.
        setTimeout(function() {
          try {
            editor.modal.source.setSourceSvg(editor.modal.source.cachedSvg, { forceFull: true });
          } finally {
            loadBtn.disabled = false;
            loadBtn.textContent = "Load full source";
          }
        }, 50);
      });

      el.querySelector("#tool_source_copy").addEventListener("click", copySourceSvg);
      el.querySelector("#tool_source_return").addEventListener("click", returnSourceSvg);

      el.querySelector("#tool_source_save").addEventListener("click", function(){
        var saveChanges = function() {
          svgCanvas.clearSelection();
          ta.blur();
          editor.zoom.multiply(1);
          editor.rulers.update();
          editor.paintBox.fill.prep();
          editor.paintBox.stroke.prep();
          editor.modal.source.close();
        }

        // Deferred (preview-only) mode: nothing was edited in the textarea.
        if (editor.modal.source.deferred) {
          editor.modal.source.close();
          return;
        }

        if (!svgCanvas.setSvgString(getSourceText())) {
          $.confirm("There were parsing errors in your SVG source.\nRevert back to original SVG source?", function(ok) {
            if(!ok) return false;
            saveChanges();
          });
        } else {
          saveChanges();
        } 
      })
      el.querySelector("#tool_source_cancel").addEventListener("click", function(){
        editor.modal.source.close();
      });
    }
  }),
  configure: new MD.Modal({
    html: `
      <h1>Configuration</h1>
      <div id="configuration">
        <button class="warning">Erase all data</button>
        </div>
      </div>`,
    js: function(el){
      const input = el.querySelector("#configuration button.warning");
      input.addEventListener("click", function(){
        state.clean();
      })
    }
  }),
  donate: new MD.Modal({
    html: `
      <h1>Donate</h1>
      <p>
        Method Draw relies on your generous donations for continued development.
        <a href="https://method.ac/donate/">Donate now</a> if you find this application useful.
      </p>`
  }),
  shortcuts: new MD.Modal({
    html: `
      <h1>Shortcuts</h1>
      <div id="shortcuts"></div>`,
    js: function(el){
      el.children[0].classList.add("modal-item-wide");
    }
  })
};
