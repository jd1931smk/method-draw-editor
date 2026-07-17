editor.keyboard = new MD.Keyboard();
editor.menu = new MD.Menu();
editor.toolbar = new MD.Toolbar();
editor.rulers = new MD.Rulers();
editor.canvas = new MD.Canvas();
editor.text = new MD.Text();
editor.panel = new MD.Panel();
editor.zoom = new MD.Zoom();
editor.paintBox = {
  fill: new MD.PaintBox('#fill_color', 'fill'),
  stroke: new MD.PaintBox('#stroke_color', 'stroke'),
  canvas: new MD.PaintBox('#canvas_color', 'canvas')
};
editor.palette = new MD.Palette();
editor.pan = new MD.Pan();

editor.import = new MD.Import();
editor.contextMenu = new MD.ContextMenu();
editor.darkmode = new MD.Darkmode();
editor.title = new MD.Title();

// bind the selected event to our function that handles updates to the UI
svgCanvas.bind("selected", editor.selectedChanged);
svgCanvas.bind("transition", editor.elementTransition);
svgCanvas.bind("changed", editor.elementChanged);
svgCanvas.bind("exported", editor.exportHandler);
svgCanvas.bind("zoomed", editor.zoom.changed);
svgCanvas.bind("contextset", editor.contextChanged);
svgCanvas.bind("extension_added", editor.extensionAdded);
svgCanvas.textActions.setInputElem($("#text")[0]);
const shapeLib = svgCanvas.addExtension.apply(this, ["shapes", MD.Shapelib]);
const eyedropper = svgCanvas.addExtension.apply(this, ["eyedropper", MD.Eyedropper]);
state.set("canvasId", t("Untitled"));
state.set("canvasMode", state.get("canvasMode"));

function applyIncomingSvg(svgText) {
  if (!svgText || typeof svgText !== "string") return false;
  const trimmed = svgText.trim();
  if (!trimmed.includes("<svg")) return false;
  const ok = svgCanvas.setSvgString(trimmed);
  if (ok) state.set("canvasContent", trimmed);
  return !!ok;
}

// load from param: ?svg=<encoded svg> or ?load=<url to fetch>
const svgParam = utils.findGetParameter("svg");
const loadParam = utils.findGetParameter("load");

if (svgParam && svgParam.includes("<svg")) {
  applyIncomingSvg(svgParam);
} else if (loadParam) {
  const error = function(err) {
      console.log(err);
      svgCanvas.setSvgString(state.get("canvasContent"));
  };

  fetch(loadParam)
    .then(r => r.text())
    .then(text => {
      if (text.includes("Error response")) return error("Error response");
      if (!applyIncomingSvg(text)) error("Invalid SVG from load URL");
    })
    .catch(error);
} else {
  svgCanvas.setSvgString(state.get("canvasContent"));
}

// Accept SVG from opener pages (question-correcter, diagramparser, etc.)
window.addEventListener("message", function(e) {
  const data = e.data;
  if (!data || typeof data !== "object") return;
  if (data.type === "LOAD_SVG" && data.content) {
    applyIncomingSvg(data.content);
  }
});

function returnSvgToOpener() {
  let text = "";
  try {
    // Uses XMLSerializer path — does not hang like View Source used to
    text = svgCanvas.getSvgString();
  } catch (err) {
    console.error(err);
    alert("Failed to read SVG from the canvas.");
    return;
  }

  // Always copy so you can paste into CopyCat even if postMessage fails
  const copyPromise = navigator.clipboard.writeText(text).catch(function() { return false; });

  if (!window.opener || window.opener.closed) {
    copyPromise.then(function() {
      alert("SVG copied to clipboard — paste it into the CopyCat SVG textarea.");
    });
    return;
  }
  try {
    window.opener.postMessage({
      type: "RETURN_SVG",
      content: text,
      source: "method-draw"
    }, "*");
    copyPromise.then(function() {
      alert("SVG sent back to CopyCat (and copied to clipboard). You can close this editor tab.");
    });
  } catch (err) {
    console.error(err);
    copyPromise.then(function() {
      alert("Could not message the opener. SVG was copied — paste it into the CopyCat SVG textarea.");
    });
  }
}

const returnBtn = document.getElementById("return-svg-button");
if (returnBtn) {
  if (window.opener && !window.opener.closed) {
    returnBtn.style.display = "inline-flex";
  }
  returnBtn.addEventListener("click", returnSvgToOpener);
}

state.set("canvasTitle", svgCanvas.getDocumentTitle());

//editor.paintBox.fill.setPaint(state.get("canvasFill"));
//editor.paintBox.stroke.setPaint(state.get("canvasStroke"));
//editor.paintBox.canvas.setPaint(state.get("canvasBackground"));

document.body.classList.remove("loading");
document.getElementById("svgcanvas").removeAttribute("title");