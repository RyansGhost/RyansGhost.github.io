# Plan: Mermaid diagrams, copyable text blocks, rf-comments write-up

Agreed with Ryan on 6 November 2026. This folder isn't built into the site.

Order: Mermaid first (the rf-comments article uses a diagram); the
copy-block article is independent.

Choices made (the recommended options):

- Mermaid loads from jsDelivr, pinned to an exact version, only on pages
  with diagrams. Not self-hosted (too many files), not pre-rendered at
  build time (needs Node and a headless browser in CI).
- Copy buttons only in the new `copy` shortcode, not on every code block.
- One combined rf-comments article, not two.

## 1. Mermaid diagrams that work with htmx

How ryanfleck.ca does it: a ` ```mermaid ` block becomes
`<pre class=mermaid>`, the post's `<main>` gets a `loadmermaid` class, and on
page load and htmx's `afterSwap` of the body, a script imports
`mermaid` (unpinned, latest) from jsDelivr if that class is there.

Improvements:

- Pin an exact Mermaid version.
- A ` ```mermaid ` render hook (`layouts/_markup/render-codeblock-mermaid.html`)
  marks only the pages with diagrams. Mermaid's ESM entry is 31 KB and
  fetches only the chunks a page's diagram types need.
- Render with `mermaid.run()` on first load and htmx 4's `htmx:after:settle`,
  skipping diagrams already drawn, so boosted links and Back both work.
- Theme diagrams from the site's palette.
- Without JavaScript, the source shows as a styled code block.
- `accTitle`/`accDescr` for screen readers.
- Markdown copies and llms.txt keep the plain Mermaid source.
- AGENTS.md section on writing diagrams.

Test: fresh load, boosted link, Back, phone width, no console errors,
no-JS fallback.

## 2. Article: copyable text blocks

How llm-bible-study.ryanfleck.ca does it: a `<figure class="prompt">` with a
caption bar and copy button; the rendered text is for reading while a
hidden `<textarea>` holds the exact text to copy; the button stays hidden
until the script runs, with `<noscript>` help; Clipboard API in secure
contexts, then an `execCommand` fallback, then "text selected, press
Ctrl+C"; a `role="status"` live region; big guides fetched from a generated
`index-for-copy.md` through a `ClipboardItem` promise.

Build: a `copy` shortcode on this site with the same design, plus a
Markdown variant, started through htmx's events. Write a short post
(~1,200 words) that uses the shortcode as a live demo and credits
llm-bible-study. Test copying in Playwright with clipboard permission on
and off.

## 3. rf-comments article and accomplishment

Source: the briefing doc "rf-comments: a Common Lisp web app, built to be
read" and the repository RyansGhost/comment-storage-system (attach
read-only; check claims and code excerpts against the source).

Article (~2,500-3,000 words): the problem; why Common Lisp; the stack (a
Mermaid architecture diagram, libraries table); Lisp web fundamentals by
example (a request through Hunchentoot, `defaction` and CSRF, special
variables vs threads, CLOS `:after` observers, `save-lisp-and-die`); four
decisions (iframe embed, per-comment email verification, Gravatar proxy,
opt-in REPL); teaching comments and the comments-only guard; bugs the real
world caught.

Accomplishment: "Built rf-comments, a Common Lisp comment service",
dated 2026-11-06, linking the repository, its branches and the 332-check CI.

Tags: `claude-code` first (Ryan swaps in the model name where wanted).

Each piece merges to `main` once it's finished and verified.
