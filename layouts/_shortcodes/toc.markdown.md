{{- /* Markdown version of toc.html, for index.md outputs: a nested list of
       links to the page's H2 (and H3) headings. */ -}}
{{- $depth := .Get "depth" | default "3" | int -}}
{{- $skip := .Get "skip" | default "references" -}}
{{- $url := .Page.Permalink -}}
{{- $headings := .Page.Fragments.Headings -}}
{{- /* With no H1 in the content, Hugo puts the H2s under one empty entry. */ -}}
{{- if and (eq (len $headings) 1) (eq (index $headings 0).ID "") -}}
  {{- $headings = (index $headings 0).Headings -}}
{{- end -}}
**Contents:**

{{ range $headings }}{{ if ne .ID $skip -}}
- [{{ .Title | htmlUnescape }}]({{ $url }}#{{ .ID }})
{{ if ge $depth 3 }}{{ range .Headings }}    - [{{ .Title | htmlUnescape }}]({{ $url }}#{{ .ID }})
{{ end }}{{ end }}{{ end }}{{ end }}
