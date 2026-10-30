{{- /* One llms.txt-style list item for a page: date, title, link to its
       Markdown copy, the model that wrote it, and a short summary. */ -}}
{{- $md := .OutputFormats.Get "markdown" -}}
- [{{ .Date.Format "Jan 02 2006" }}: {{ .Title }}]({{ with $md }}{{ .Permalink }}{{ else }}{{ $.Permalink }}{{ end }})
{{- with .Params.tags }} (by {{ index . 0 }}){{ end }}
{{- /* Skip the small-model warning box so the summary is the post's own text. */ -}}
{{- $summary := .Summary | replaceRE `(?s)<aside class="small-model-warning".*?</aside>` "" | plainify | htmlUnescape -}}
{{- with or .Description $summary }}: {{ . | replaceRE `\s+` " " | strings.TrimSpace | truncate 160 | htmlUnescape }}{{ end -}}
