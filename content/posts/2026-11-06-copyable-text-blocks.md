---
date: 2026-11-06T20:50:00Z
draft: false
title: "Copy Buttons That Always Work"
description: "How to build a copyable text block for a static site: copy the text as written, fall back gracefully when the browser won't, tell screen readers what happened, and keep working with htmx."
categories:
  - technology
tags:
  - "claude-code"
  - javascript
  - hugo
  - accessibility
  - htmx
---

Some text is meant to be pasted somewhere else: a prompt for an AI assistant, a command, a config snippet. A Copy button next to it saves people from fiddly selecting, and from missing a line. This site now has one, borrowed from Ryan's [LLM Bible Study](https://llm-bible-study.ryanfleck.ca/) site, whose prompts and study guides people copy into AI chats. Here it is:

{{< copy label="Try it" >}}
You are a patient tutor. Teach me one idea at a time, and ask me a question before you explain each one. Start by asking what I already know.
{{< /copy >}}

A Copy button looks trivial: call `navigator.clipboard.writeText()` and you're done. But that call fails in more places than you'd expect. A good copy block also needs four things: copy the right text, handle failure, say what happened, and survive page swaps.

## Copy what was written, show it formatted

The block holds the text twice. The visible part is rendered Markdown, for reading. A hidden, read-only `<textarea>` holds the text exactly as written, and that's what the button copies:

```html
<figure class="copy-block">
  <figcaption class="copy-block__bar">
    <span class="copy-block__label">Try it</span>
    <button type="button" class="copy-block__button">Copy</button>
  </figcaption>
  <div class="copy-block__body"><!-- the text, rendered --></div>
  <textarea class="copy-block__source" hidden readonly aria-hidden="true" tabindex="-1">The text, as written</textarea>
  <span class="copy-block__status visually-hidden" role="status" aria-live="polite"></span>
</figure>
```

Copying the rendered HTML instead would lose things. Line breaks collapse, `**bold**` loses its asterisks, and a link loses its address. For a prompt, the Markdown *is* the content, and AI assistants read it well. So a list stays a list when pasted:

{{< copy label="Formatted, but copied as written" >}}
Summarise this article in **three** bullet points:

- one sentence each;
- plain words;
- no jargon.
{{< /copy >}}

Copying the text as written has one consequence for authors: write each paragraph on one line. Markdown joins wrapped lines when it renders them, but the copy keeps every line break.

`hidden` keeps the textarea out of the layout. `aria-hidden` and `tabindex="-1"` keep it away from screen readers and the Tab key, because the readable copy is already on the page.

On this site the block is a Hugo shortcode, so a post just wraps the text:

```text
{{</* copy label="Try it" */>}}
You are a patient tutor. ...
{{</* /copy */>}}
```

## Expect the clipboard to fail

`navigator.clipboard.writeText()` is the modern way, and every current browser has it. It's "available only in secure contexts (HTTPS)", though, and a browser can still refuse it.[^writetext][^clipboard-api] So each step has a fallback:

1. **The Clipboard API**, when the page is a secure context.
2. **The old `execCommand("copy")`**, on a temporary textarea. MDN marks `execCommand` as deprecated, but it still works in places the Clipboard API doesn't, like a page opened over plain HTTP.[^execcommand]
3. **Select the text, and ask.** If both fail, the button selects the visible text and changes to "Press Ctrl+C". The person is one key press from done, instead of stuck.

```js
function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(
      function () { return true; },
      function () { return copyWithTextarea(text); });
  }
  return Promise.resolve(copyWithTextarea(text));
}
```

`copyWithTextarea` puts the text in an off-screen textarea, selects it, calls `document.execCommand("copy")` in a `try`, and removes the textarea again. It returns whether the copy worked.

## Say what happened

Sighted users see the button's label change to "Copied!" for two seconds. Screen reader users need to hear it, so each block has an empty element with `role="status"`. Writing "Copied to the clipboard." into it is announced, without moving focus. MDN describes a status as "advisory information for the user that is not important enough to be an alert". That role has an implicit `aria-live` value of `polite`, so the announcement waits for a pause rather than interrupting.[^status] The `visually-hidden` class hides the element from sight but not from assistive technology. (`display: none` would hide it from both.)

When the copy fails, the status says what to do instead: "Couldn't copy automatically. The text is selected: press Ctrl+C, or Command+C on a Mac."

## No JavaScript, no button

A Copy button that does nothing is worse than none. Without JavaScript, the text still shows and can be selected by hand, but the button must go. LLM Bible Study renders its buttons with `hidden` and lets the script reveal them. This site does the reverse: the button is visible, and one rule in the page's `<head>` hides it when scripts are off:

```html
<noscript><style>.copy-block__button { display: none; }</style></noscript>
```

That way the button doesn't pop in a moment after the page loads, and no script has to find and reveal buttons. That matters for the next part.

## Survive htmx page swaps

This site uses [htmx](https://htmx.org/) to load pages without a full reload: a click fetches the next page and swaps in its body. Code that attaches a click handler to each button when the page loads would miss every button on pages swapped in later.

So there's only one listener, on the document, and it checks whether a click came from a Copy button. Clicks bubble up from the button to the document, so this one handler covers every block, including ones that didn't exist when it was added:[^bubbling]

```js
document.addEventListener("click", function (event) {
  var button = event.target.closest && event.target.closest(".copy-block__button");
  if (!button) {
    return;
  }
  var block = button.closest(".copy-block");
  copyText(block.querySelector(".copy-block__source").value).then(function (copied) {
    // ... update the label and the status, or select the text ...
  });
});
```

This is called *event delegation*. With it, and the no-JavaScript rule above, nothing needs to run after an htmx swap.

## Copying a whole file

LLM Bible Study has one more trick. Its study guides are too long to embed in the page, so the button holds a URL, and the click fetches a Markdown file prepared for copying. The catch is that browsers, Safari especially, only let a page write to the clipboard straight after a click, and a network request takes time. So it passes `navigator.clipboard.write()` a `ClipboardItem` built from a *promise* of the text. The write starts during the click, and finishes when the download does.[^clipboarditem] It falls back to `writeText` after the download, then to the textarea method. This site doesn't need that yet, but it's the way to copy text that isn't on the page.

## Checklist

- [ ] Copy the source text, not the rendered HTML.
- [ ] Try the Clipboard API, then `execCommand("copy")`, then select the text and say "press Ctrl+C".
- [ ] Change the button label, and announce the result in a `role="status"` element.
- [ ] Hide the button when JavaScript is off; the text stays selectable.
- [ ] Use one delegated listener, so swapped-in pages work with no extra code.

## References

[^writetext]: MDN Web Docs, "Clipboard: writeText() method." <https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText>
[^clipboard-api]: MDN Web Docs, "Clipboard API" (secure contexts and security considerations). <https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API>
[^execcommand]: MDN Web Docs, "Document: execCommand() method." <https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand>
[^status]: MDN Web Docs, "ARIA: status role." <https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role>
[^bubbling]: MDN Web Docs, "Event bubbling" (event delegation). <https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling>
[^clipboarditem]: MDN Web Docs, "ClipboardItem." <https://developer.mozilla.org/en-US/docs/Web/API/ClipboardItem>
