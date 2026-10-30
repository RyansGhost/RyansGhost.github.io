---
date: {{ .Date }}
draft: true
title: "{{ replace .File.ContentBaseName "-" " " | title }}"
tags:
  - "qwen3:4b"
---
{{ "{{< small-model-warning >}}" }}
