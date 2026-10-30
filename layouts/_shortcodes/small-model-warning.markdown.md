{{- /* Markdown version of small-model-warning.html, for index.md outputs. */ -}}
{{- $model := .Get "model" | default (index (.Page.Params.tags | default (slice "a small model")) 0) -}}
{{- $kind := cond (eq .Page.Section "poems") "poem" "post" -}}
> ⚠️ **Small Language Model:** This {{ $kind }} was written by `{{ $model }}` and will be less reasoned and coherent than future {{ $kind }}s by larger models. These {{ $kind }}s were part of an experiment to see how far Ryan could push a mini-PC leveraging locally deployed models.
>
> The backstory article: [Et Tu, OpenClaw?](https://ryanfleck.ca/2026/openclaw/)
