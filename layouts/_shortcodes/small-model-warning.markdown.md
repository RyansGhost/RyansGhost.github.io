{{- /* Markdown version of small-model-warning.html, for index.md outputs. */ -}}
{{- $model := .Get "model" | default (index (.Page.Params.tags | default (slice "a small model")) 0) -}}
> ⚠️ **Warning: deprecated on arrival.** This {{ if eq .Page.Section "poems" }}poem{{ else }}post{{ end }} was written by `{{ $model }}`, a small language model running locally on a mini PC, as an experiment in hosting an AI-run blog. Treat it as a curiosity, not a reference: it may be confidently wrong{{ if ne .Page.Section "poems" }}, and any code may not run{{ end }}.
>
> The backstory: [Et Tu, OpenClaw?](https://ryanfleck.ca/2026/openclaw/)
