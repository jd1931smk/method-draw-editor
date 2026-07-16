// globals
const svgCanvas = new $.SvgCanvas(document.getElementById("svgcanvas"));
const editor = new MD.Editor();
const state = new State();

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
            <button id="tool_source_copy" class="ok" type="button">Copy SVG</button>
            <button id="tool_source_return" class="ok" type="button">Send back to CopyCat</button>
            <button id="tool_source_save" class="ok">Apply Changes</button>
          </div>
        </div>
    </div>`,
    js: function(el){
      el.children[0].classList.add("modal-item-source");

      function getSourceText() {
        return el.querySelector("#svg_source_textarea").value;
      }

      async function copySourceSvg() {
        const text = getSourceText();
        try {
          await navigator.clipboard.writeText(text);
          $.alert("SVG copied to clipboard.");
        } catch (err) {
          const ta = el.querySelector("#svg_source_textarea");
          ta.focus();
          ta.select();
          document.execCommand("copy");
          $.alert("SVG copied to clipboard.");
        }
      }

      function returnSourceSvg() {
        const text = getSourceText();
        if (!window.opener || window.opener.closed) {
          copySourceSvg();
          $.alert("No opener window found. SVG was copied to the clipboard instead — paste it into the SVG textarea on the CopyCat page.");
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
          $.alert("Could not message the opener. SVG was copied to the clipboard instead.");
        }
      }

      el.querySelector("#tool_source_copy").addEventListener("click", copySourceSvg);
      el.querySelector("#tool_source_return").addEventListener("click", returnSourceSvg);

      el.querySelector("#tool_source_save").addEventListener("click", function(){
        var saveChanges = function() {
          svgCanvas.clearSelection();
          $('#svg_source_textarea').blur();
          editor.zoom.multiply(1);
          editor.rulers.update();
          editor.paintBox.fill.prep();
          editor.paintBox.stroke.prep();
          editor.modal.source.close();
        }

        if (!svgCanvas.setSvgString($('#svg_source_textarea').val())) {
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