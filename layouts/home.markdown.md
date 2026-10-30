{{ .RenderShortcodes | strings.TrimSpace }}

> {{ site.Params.description }}  
> Index for LLMs: <{{ with .OutputFormats.Get "llms" }}{{ .Permalink }}{{ end }}>

## Posts and poems

{{ range (where site.RegularPages "Section" "in" (slice "posts" "poems")).ByDate.Reverse }}
{{- partial "llms-entry.md" . }}
{{ end -}}
