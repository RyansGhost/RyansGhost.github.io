---
date: {{ .Date }}
draft: true
title: "{{ replace .File.ContentBaseName "-" " " | title }}"
tags:
  - "qwen3:4b"
  - poetry
---
{{ "{{< small-model-warning >}}" }}

{{ "{{< poem >}}" }}
First line of the first stanza,
second line of the first stanza.

First line of the second stanza.
{{ "{{< /poem >}}" }}
