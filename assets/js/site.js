// Page navigation is boosted by htmx (hx-boost on <html>): same-site links
// load in the background and swap the page body, instead of a full reload.
// Links to files that aren't HTML pages, like llms.txt, the index.md copies,
// feeds and full-size images, must load normally instead, or their raw text
// would be swapped into the page.
document.addEventListener("htmx:beforeRequest", function (event) {
  if (!event.detail.boosted) {
    return;
  }
  var path = event.detail.requestConfig.path;
  var pathname = new URL(path, window.location.href).pathname;
  if (/\.(md|txt|xml|json|jpe?g|png|gif|webp|svg|pdf)$/i.test(pathname)) {
    event.preventDefault();
    window.location.href = path;
  }
});
