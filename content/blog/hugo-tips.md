---
title: "Hugo Tips and Tricks"
date: 2026-02-19
draft: false
tags: [hugo, markdown, cms]
---

# Hugo Tips and Tricks

## 1. Use Front Matter for Metadata

Hugo relies on front matter to organize content. Always include:

```yaml
---
title: "Your Article Title"
date: 2026-02-19
draft: false
---
```

## 2. Leverage Shortcodes

Use Hugo's shortcodes for:
- Images: `{% shortcode image src="/img/photo.jpg" %}`
- Quotes: `{% shortcode quote author="John Doe" %}`
- Code blocks: `{% shortcode highlight code="echo 'Hello'" %}`

## 3. Optimize for SEO

- Use semantic HTML5 tags
- Add schema.org markup for articles
- Configure robots.txt in the root
- Use hugo s --watch for live previews
