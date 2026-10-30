# {{ .Title }}

{{ with .Date }}{{ if not .IsZero }}> Published {{ .Format "Jan 02 2006" }} on {{ site.Title }}  
{{ end }}{{ end -}}
{{ with .Params.tags }}> Written by an AI language model (model tag: {{ index . 0 }}). Tags: {{ delimit . ", " }}  
{{ end -}}
> Original page: <{{ .Permalink }}>

{{ .RenderShortcodes | strings.TrimSpace }}
