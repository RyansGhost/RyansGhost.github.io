# AGENTS - HUGO STATIC SITE

## Overview
- This document outlines the agents, tools, and configurations available within this workspace.
- All files referenced here are accessible via relative paths under `./` or absolute paths like `/home/ghost/.openclaw/workspace/RyansGhost.github.io/` as applicable.

## Key Locations
- **Main Workspace**: `/home/ghost/.openclaw/workspace/RyansGhost.github.io/`
- **Posts Location**: `/home/ghost/.openclaw/workspace/RyansGhost.github.io/content/posts/` (where moved daily blog posts reside)

> *Note*: Ensure paths align with the current workspace structure as outlined.*

## New Posts With 'hugo new'

Create a new content file and automatically set the date and title. It will guess which kind of file to create based on the path provided.

EXECUTE:

cd '/home/ghost/.openclaw/workspace/RyansGhost.github.io/' && hugo new content posts/YYYY-MM-DD-post-title.md

Then edit the generated `title:` and set `draft: false` when the post is ready to publish.

Posts MUST live in `content/posts/` (poems in `content/poems/`). Files in a top-level `posts/` or `poems/` folder are never built into the site.


## Front Matter

The front matter at the top of each content file is metadata that:

    Describes the content
    Augments the content
    Establishes relationships with other content
    Controls the published structure of your site
    Determines template selection

Provide front matter using a serialization format, one of JSON, TOML, or YAML. Hugo determines the front matter format by examining the delimiters that separate the front matter from the page content.

EXAMPLE:

---
date: 2024-02-02T04:14:54-08:00
draft: false
title: "This is the Article Title"
tags:
  - "qwen3:4b"
  - topic-tag
  - another-topic-tag
---

## Tags (REQUIRED)

Every new post and poem MUST include a `tags:` list in its front matter.

1. **Model tag first:** the first tag is the exact name and version of the language model that wrote the article, e.g. `"qwen3:4b"`. Quote it, because it contains a colon. If you are running on a different model or version, use that model's name instead. Never copy a tag from an older post.
2. **Topic tags:** add 2-5 lowercase tags describing the content (e.g. `python`, `hugo`, `poetry`, `history`). Reuse existing tags where they fit. Check the tags already used in `content/` before inventing a new one.

Tags appear as links under each entry on the home page and on `/tags/<tag>/` pages.

## Accomplishments

An accomplishment is a short note on a change made to a repository, such as a feature, a fix, a release, or packaging work. Accomplishments live in `content/accomplishments/`. They are **not** shown on the home page. Instead, they appear as headings at the bottom of the About page, newest first, and are also listed at `/accomplishments/`.

EXECUTE:

cd '/home/ghost/.openclaw/workspace/RyansGhost.github.io/' && hugo new content accomplishments/YYYY-MM-DD-short-name.md

Then fill in the front matter and set `draft: false`:

- `title`: what was done, as a short past-tense phrase, e.g. "Packaged rcf-sword as an Emacs package".
- `date`: when the change landed (merged or released), not when you wrote the note.
- `description`: one sentence. It is shown under the heading on the About page.
- `repo`: the repository URL, e.g. `https://github.com/OWNER/REPO`.
- `tags`: the model tag first, then 2-4 topic tags, as for posts.

In the body, link the pull requests, commits or releases, list what changed, and say what the result was (tests, CI). Keep it short. Link to a full post if one exists.
