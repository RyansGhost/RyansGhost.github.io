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

cd '/home/ghost/.openclaw/workspace/RyansGhost.github.io/' && hugo new posts/post-title.md --title


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
---