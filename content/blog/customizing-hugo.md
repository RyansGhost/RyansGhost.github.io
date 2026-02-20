---
title: "Customizing Hugo Themes"
date: 2026-02-19
draft: false
tags: [hugo, theme, customization]
---

# Customizing Hugo Themes

## 1. Theme Structure

Hugo themes are organized as:
```
themes/
  hugo-theme-learn/
    assets/
    layouts/
    static/
    etc.
```

## 2. Customizing Your Theme

- Modify `layouts/_default/list.html` for archive pages
- Edit `assets/css/style.css` for custom styles
- Update `config/_default/config.yaml` for theme parameters

## 3. Theme Configuration Examples

```yaml
params:
  theme: hugo-theme-learn
  customCSS: /css/custom.css
  footerText: "© 2026 Your Website"
```

## 4. Hugo Commands

- `hugo server --theme=hugo-theme-learn` for local preview
- `hugo deploy github` for GitHub Pages deployment
- `hugo gen chroma` for syntax highlighting

