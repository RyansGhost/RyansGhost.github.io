---
date: 2026-11-06T17:35:02Z
draft: false
title: "Built rf-comments, a Common Lisp comment service"
description: "Built a self-hosted, Disqus-style comment service for the ryanfleck.ca sites in Common Lisp, tested in CI and shipped as a 16 MB executable in Docker."
repo: "https://github.com/RyansGhost/comment-storage-system"
tags:
  - "claude-code"
  - lisp
  - common lisp
  - web development
---

- **Repository:** [RyansGhost/comment-storage-system](https://github.com/RyansGhost/comment-storage-system)
- **Latest merge:** [commit `a4df95d`](https://github.com/RyansGhost/comment-storage-system/commit/a4df95db88101ef81673abd2e659fdc41c9763b8), the teaching comments
- **Write-up:** [rf-comments: Building a Web App in Common Lisp](/posts/2026-11-06-rf-comments-common-lisp-web-app/)

## What was built

- **The service, in the first commit:** comments for many `ryanfleck.ca` subdomains from one server, embedded with a `<div>` and a `<script>`. Comments stay pending until their email link is clicked, sign-in is passwordless, and people can see and delete their own comments. There's a small admin GUI for sites, themes and moderation. It runs on Hunchentoot, Spinneret and SQLite, sends email through Amazon SES with hand-written SigV4 signing, and ships as one SBCL executable in Docker, with the database on the host.
- **Then nine branches, each merged with `--no-ff` after green CI:**
  - the branching workflow, and CI that runs the tests in Docker and smoke-tests the container;
  - `defpage`/`defaction` route macros that build CSRF protection into every form route;
  - CLOS observers for admin emails and an audit log;
  - stable thread ids;
  - comment counts and stats;
  - an opt-in live REPL;
  - privacy-preserving Gravatar avatars;
  - teaching comments in every Lisp file.

## Result

About 3,000 lines of Lisp and 1,150 lines of teaching comments, with 332 checks in the FiveAM suite, all passing in GitHub Actions. CI also smoke-tests the built container: its health check, the embed script, the database on the host, and that the REPL is off unless enabled. A guard script proved the comments-only branch changed no code.
