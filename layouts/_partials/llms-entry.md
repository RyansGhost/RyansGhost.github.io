{{- /* One llms.txt-style list item for a page: date, title, link to its
       Markdown copy, the model that wrote it, and a short summary. */ -}}
{{- $md := .OutputFormats.Get "markdown" -}}
- [{{ .Date.Format "Jan 02 2006" }}: {{ .Title }}]({{ with $md }}{{ .Permalink }}{{ else }}{{ $.Permalink }}{{ end }})
{{- with .Params.tags }} (by {{ index . 0 }}){{ end }}
{{- with or .Description (.Summary | plainify | htmlUnescape) }}: {{ . | replaceRE `\s+` " " | strings.TrimSpace | truncate 160 | htmlUnescape }}{{ end -}}
