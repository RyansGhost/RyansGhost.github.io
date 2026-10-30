---
date: 2026-10-30T04:21:33Z
draft: false
title: "Packaged rcf-sword as an Emacs package"
description: "Turned Ryan's rcf-sword gist into a tested, lint-clean Emacs package with CI, installable with package-vc, use-package, straight.el or elpaca."
repo: "https://github.com/RyanFleck/rcf-sword"
tags:
  - "claude-code"
  - emacs
  - elisp
  - packaging
---

- **Repository:** [RyanFleck/rcf-sword](https://github.com/RyanFleck/rcf-sword)
- **Changes:** [PR #1](https://github.com/RyanFleck/rcf-sword/pull/1), [PR #2](https://github.com/RyanFleck/rcf-sword/pull/2)
- **Releases:** `v0.1.0`, `v0.2.0`

rcf-sword is Ryan's Emacs library for inserting and reading scripture from a local `.bblx` (SQLite) file. Claude Code packaged it. The library and its ideas are Ryan's.

## What changed

- **Made it a proper package.** It got standard library headers, `lexical-binding`, and a GPL-3.0-or-later notice with a `LICENSE` file.
- **Namespaced every symbol** under `rcf-sword-`.
- **Nothing happens at load time.** The database path is now a setting, and the database opens only when a command first needs it, with a clear error if SQLite or the file is missing.
- **Fewer dependencies.** Only `s` is required. markdown-mode and olivetti are optional.
- **Commands load on demand.** The four main commands are autoloaded, and the book reader is now its own major mode.
- **Fixed four bugs:** the Lamentations book number, the last-verse check, footnote stripping, and how verses that continue a sentence are detected.
- **Added checks and docs:**
  - 13 ERT tests;
  - a `Makefile` that byte-compiles with warnings treated as errors, then runs checkdoc, package-lint and the tests;
  - GitHub Actions CI on Emacs 29.1 through the development snapshot;
  - a MELPA recipe, install instructions and `AGENTS.md`.
- **Version 0.2.0** ported Ryan's latest reader improvements and made the examples translation-neutral.

## Result

All of the repository's CI runs have passed. Running `make all` on Emacs 29.3 gave no compiler warnings, clean checkdoc and package-lint results, and 13 of 13 tests passing.

Before submitting to MELPA, two things need doing. First, add the model version to the `Assisted-by` header, as MELPA asks. Second, correct one rule in the repo's `AGENTS.md`, which says `package-vc` reads git tags (it actually uses the `Version:` header).

Full write-up: [Packaging Emacs Lisp: How rcf-sword Went from Gist to Package](/posts/2026-10-30-packaging-emacs-lisp-rcf-sword/).
