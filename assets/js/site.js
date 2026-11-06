// Page navigation is boosted by htmx (hx-boost:inherited on <html>): same-site
// links load in the background and swap the page body, instead of a full
// reload. htmx then scrolls the new page to the top (see body in
// static/css/custom.css), or to the #fragment in the link.
// Links to files that aren't HTML pages, like llms.txt, the index.md copies,
// feeds and full-size images, must load normally instead, or their raw text
// would be swapped into the page. Cancelling htmx:before:init for a link stops
// htmx from boosting it.
document.addEventListener("htmx:before:init", function (event) {
  var link = event.target;
  if (link.tagName === "A" && /\.(md|txt|xml|json|jpe?g|png|gif|webp|svg|pdf)$/i.test(link.pathname)) {
    event.preventDefault();
  }
});

// Diagrams. A ```mermaid code block becomes <pre class="mermaid"> holding the
// diagram's source (layouts/_markup/render-codeblock-mermaid.html). Mermaid is
// loaded only when a page has one, and draws any not yet drawn: on the first
// page load, and after each boosted page load or Back. Mermaid's ESM entry is
// small and fetches only the code for the diagram types on the page. To
// update it, change the pinned version here.
var MERMAID_URL = "https://cdn.jsdelivr.net/npm/mermaid@12.2.0/dist/mermaid.esm.min.mjs";
var PENDING_DIAGRAMS = "pre.mermaid:not([data-queued])";
var mermaidLoaded = null;

// Colours and font come from the site's own CSS variables (the risotto palette).
function mermaidTheme() {
  var css = getComputedStyle(document.documentElement);
  var color = function (name) { return css.getPropertyValue("--" + name).trim(); };
  return {
    darkMode: true,
    fontFamily: getComputedStyle(document.body).fontFamily,
    fontSize: "14px",
    background: color("off-bg"),
    primaryColor: color("inner-bg"),
    primaryTextColor: color("fg"),
    primaryBorderColor: color("link"),
    secondaryColor: color("off-bg"),
    secondaryBorderColor: color("logo"),
    tertiaryColor: color("bg"),
    tertiaryBorderColor: color("muted"),
    lineColor: color("off-fg"),
    textColor: color("fg"),
    clusterBkg: color("bg"),
    clusterBorder: color("muted"),
    edgeLabelBackground: color("off-bg"),
    noteBkgColor: color("inner-bg"),
    noteTextColor: color("fg"),
    noteBorderColor: color("highlight")
  };
}

function drawDiagrams() {
  var diagrams = Array.prototype.slice.call(document.querySelectorAll(PENDING_DIAGRAMS));
  if (!diagrams.length) {
    return;
  }
  // Mark them now, so a second call while these draw leaves them alone, and
  // keep their source: Mermaid empties a diagram that fails to parse.
  var sources = diagrams.map(function (diagram) {
    diagram.setAttribute("data-queued", "");
    return diagram.textContent;
  });
  mermaidLoaded = mermaidLoaded || import(MERMAID_URL).then(function (module) {
    var mermaid = module.default;
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      // A diagram with a mistake keeps showing its source, not an error picture.
      suppressErrorRendering: true,
      theme: "base",
      themeVariables: mermaidTheme()
    });
    return mermaid;
  });
  mermaidLoaded.then(function (mermaid) {
    return mermaid.run({ nodes: diagrams, suppressErrors: true });
  }).catch(function (error) {
    // Offline or blocked: try again on the next page.
    mermaidLoaded = null;
    console.error("Couldn't load Mermaid to draw diagrams:", error);
  }).then(function () {
    // Any diagram that didn't draw shows its source again.
    diagrams.forEach(function (diagram, i) {
      if (!diagram.querySelector("svg")) {
        diagram.textContent = sources[i];
      }
    });
  });
}

document.addEventListener("htmx:after:settle", drawDiagrams);
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", drawDiagrams);
} else {
  drawDiagrams();
}
