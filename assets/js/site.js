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
var MIN_DIAGRAM_SCALE = 0.6;
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
    diagrams.forEach(function (diagram, i) {
      var svg = diagram.querySelector("svg");
      if (!svg) {
        // It didn't draw: show its source again.
        diagram.textContent = sources[i];
        return;
      }
      // Drawn diagrams shrink to fit the page, but never below 60% of their
      // natural width (Mermaid's max-width), where text gets too small to
      // read. Past that, the diagram scrolls sideways instead.
      var natural = parseFloat(svg.style.maxWidth);
      if (natural) {
        svg.style.minWidth = Math.round(natural * MIN_DIAGRAM_SCALE) + "px";
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

// Copy buttons ({{< copy >}}, layouts/_shortcodes/copy.html). One listener on
// the document handles every button, including ones in pages htmx swaps in
// later, so nothing needs setting up per page. The button copies the block's
// hidden textarea, which holds the text exactly as written. If the browser
// won't copy, the text is selected so a key press can.
var COPY_RESET_MS = 2000;

// The older way to copy, for browsers or pages without the Clipboard API.
function copyWithTextarea(text) {
  var field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.top = "-1000px";
  document.body.appendChild(field);
  field.select();
  var copied = false;
  try {
    copied = document.execCommand("copy");
  } catch (error) {
    copied = false;
  }
  document.body.removeChild(field);
  return copied;
}

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(
      function () { return true; },
      function () { return copyWithTextarea(text); });
  }
  return Promise.resolve(copyWithTextarea(text));
}

function selectContents(element) {
  var range = document.createRange();
  range.selectNodeContents(element);
  var selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

document.addEventListener("click", function (event) {
  var button = event.target.closest && event.target.closest(".copy-block__button");
  if (!button) {
    return;
  }
  var block = button.closest(".copy-block");
  var label = button.querySelector(".copy-block__button-text");
  var status = block.querySelector(".copy-block__status");
  copyText(block.querySelector(".copy-block__source").value).then(function (copied) {
    if (copied) {
      label.textContent = "Copied!";
      status.textContent = "Copied to the clipboard.";
    } else {
      selectContents(block.querySelector(".copy-block__body"));
      label.textContent = "Press Ctrl+C";
      status.textContent = "Couldn't copy automatically. The text is selected: press Ctrl+C, or Command+C on a Mac.";
    }
    button.classList.toggle("is-copied", copied);
    clearTimeout(button.copyReset);
    button.copyReset = setTimeout(function () {
      label.textContent = "Copy";
      status.textContent = "";
      button.classList.remove("is-copied");
    }, copied ? COPY_RESET_MS : COPY_RESET_MS * 3);
  });
});
