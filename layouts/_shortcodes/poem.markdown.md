{{- /* Markdown version of poem.html, for index.md outputs. */ -}}
{{ .Inner | strings.TrimSpace | replaceRE `(\S)[ \t]*\r?\n` "${1}  \n" }}
