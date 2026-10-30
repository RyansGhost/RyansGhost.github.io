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
