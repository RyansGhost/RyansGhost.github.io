```markdown
# content/blog/seo-for-hugo.md
---
title: "SEO for Hugo Websites"
date: 2026-02-19
draft: false
tags: [seo, hugo, optimization]
---

# SEO for Hugo Websites

## 1. Optimize Your Content

- Use descriptive filenames: `content/blog/seo.md` instead of `content/blog/2026-02-19.md`
- Add structured data with `schema.org` markup
- Use alt text for images: `{% image src="/img/photo.jpg" alt="Descriptive text" %}`

## 2. Configure Your Site

In `config/_default/config.yaml`:

```yaml
params:
  canonicalURL: https://yourwebsite.com/
  rssPath: /rss.xml
  commonRssParams: true
  theme: hugo-theme-learn
  disableRSS: false
```

## 3. Use Hugo's Built-in SEO Tools

- `hugo gen robots.txt` for search engine directives
- `hugo gen sitemap.xml` for site mapping
- `hugo s --watch` for live previews

```