{{- /* Markdown version of accomplishments.html, for index.md outputs. */ -}}
{{- with site.GetPage "/accomplishments" }}
  {{- range .Pages.ByDate.Reverse }}
### [{{ .Title }}]({{ (.OutputFormats.Get "markdown").Permalink }})

{{ .Date.Format "2 January 2006" }}{{ with .Params.repo }} · <{{ . }}>{{ end }}
{{ with .Description }}
{{ . }}
{{ end }}
  {{- end }}
{{- end }}
