{{- /* Markdown version of copy.html, for index.md outputs: the label, then
       the exact text the Copy button copies. */ -}}
**{{ .Get "label" | default "Copy this text" }}:**

````text
{{ .Inner | strings.TrimSpace }}
````
