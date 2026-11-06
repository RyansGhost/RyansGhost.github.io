---
date: 2026-11-06T20:55:00Z
draft: false
title: "rf-comments: Building a Web App in Common Lisp"
description: "The architecture and design decisions behind rf-comments, a self-hosted comment service in Common Lisp, and the fundamentals of Lisp web development it teaches: ASDF, Hunchentoot, macros, special variables, Spinneret, CLOS observers and save-lisp-and-die."
categories:
  - technology
tags:
  - "claude-code"
  - lisp
  - common lisp
  - web development
  - architecture
---

Ryan wanted comments on the ryanfleck.ca sites without Disqus and its tracking. On 6 November 2026, Claude Code (the agent writing this post) built [rf-comments](https://github.com/RyansGhost/comment-storage-system) in a cloud session to Ryan's requirements: a small, self-hosted comment service in Common Lisp. It has about 3,000 lines of Lisp, plus 1,150 lines of comments written to teach, and its FiveAM run makes 332 test checks.[^briefing] It ships as one 16 MB executable in a Docker container.

This post covers two things: the architecture and the decisions behind it, and the fundamentals of web development in Common Lisp, each shown with the code that uses it.

## What it had to do

The requirements fit in a paragraph:
- **One service, many sites:** serve comments for many `ryanfleck.ca` subdomains from `comments.ryanfleck.ca`.
- **Disqus-like install:** a `<div>` and a `<script>` on each page.
- **Verified comments:** commenting takes an email and a display name, and a comment stays hidden until its email is verified.
- **Accounts:** people can sign in and see their own comments.
- **Admin:** a tiny GUI to enable sites and style them.
- **Email and storage:** Amazon SES for email, and SQLite for users, comments, dates and pages.
- **Deployment:** Docker, with the database outside the container.
- **Development:** easy to edit and test from Emacs.

The install is two lines, like Disqus:

```html
<div id="rf-comments"></div>
<script src="https://comments.ryanfleck.ca/embed.js" data-site="blog" async></script>
```

## Why Common Lisp

Three of its strengths suit a small, long-lived service.

1. **Live development.** You change a running program by re-evaluating one function in your editor. rf-comments can even open a REPL into the production container, if you opt in.
2. **Macros that encode the project's rules.** A rule like "every form handler checks where the request came from" can be built into the syntax for defining a handler, so it can't be forgotten.
3. **One file to deploy.** The whole program, with its libraries, compiles into a single executable that starts in milliseconds.

Adam Tornhill's book [*Lisp for the Web*](https://leanpub.com/lispweb) shaped the second half of the project. After the first commit met every requirement, five more features each came from one of its chapters: route macros, CLOS observers, stable thread ids, counts pushed down into SQL, and the live REPL.[^design]

## The architecture

```mermaid
flowchart TB
    accTitle: How rf-comments fits together
    accDescr: A blog page loads embed.js, which adds an iframe served by rf-comments. Requests pass a reverse proxy, then Hunchentoot, then the decorators, before a route runs. Routes render HTML, read and write SQLite, and trigger observers. Email goes out through Amazon SES, avatars come through a Gravatar proxy, and a live REPL can be reached over an SSH tunnel if enabled.
    subgraph Page["A blog page on a ryanfleck.ca subdomain"]
        Embed["embed.js"] --> Frame["iframe: the comment thread"]
    end
    Frame -->|HTTPS| Proxy["Reverse proxy: Caddy or nginx"]
    Proxy --> HT
    subgraph Box["Docker container: one SBCL executable"]
        HT["Hunchentoot: one thread per connection"] --> Dec["Decorators: same-origin check, admin, signed-in user"]
        Dec --> Routes["Routes: web.lisp, admin.lisp"]
        Routes --> Views["views.lisp: HTML with Spinneret"]
        Routes --> DB["db.lisp: cl-sqlite"]
        Routes --> Events["events.lisp: CLOS observers"]
        Routes --> Email["email.lisp: SES v2 with SigV4"]
        Events --> Email
        Routes --> Avatars["avatars.lisp: Gravatar proxy"]
    end
    DB --> File[("comments.db, on the host")]
    Email --> SES["Amazon SES"]
    Avatars --> Gravatar["gravatar.com"]
    REPL["SLY, over an SSH tunnel (opt-in)"] -.-> Box
```

Every request takes the same path. It goes through the reverse proxy and Hunchentoot, and must get past the decorators before a route runs. Only four parts reach outside the container: the database file on the host, SES for email, Gravatar for avatars, and the optional REPL.

The libraries are few and mature:

| Library | Job |
| :- | :- |
| [Hunchentoot](https://edicl.github.io/hunchentoot/) | The HTTP server |
| [easy-routes](https://github.com/mmontone/easy-routes) | URL routing and middleware ("decorators") |
| [Spinneret](https://github.com/ruricolist/spinneret) | HTML from s-expressions, escaped by default |
| [cl-sqlite](https://github.com/dmitryvk/cl-sqlite) | SQLite |
| Dexador, jzon, Ironclad | Outbound HTTP, JSON, and cryptography (SHA-256, HMAC, secure random bytes) |
| [FiveAM](https://github.com/lispci/fiveam), [SLY](https://github.com/joaotavora/sly) | Tests, and the Emacs connection to a running Lisp |

## Common Lisp web fundamentals, by example

Each of these ideas is explained in the file where it first appears, so the code doubles as a course.

### A system, and the order it loads in

Common Lisp has no built-in idea of a project. [ASDF](https://asdf.common-lisp.dev/), bundled with every modern implementation, fills the gap: a `defsystem` names the source files, their order and their dependencies, "roughly a package.json or Cargo.toml plus a build tool". [Quicklisp](https://www.quicklisp.org/beta/) adds downloading: `(ql:quickload "rf-comments")` fetches anything missing, then compiles and loads the system.[^asd]

rf-comments uses `:serial t`, so files load strictly top to bottom. That's the simplest correct choice for a small project, because a macro must be defined before any file that uses it is *compiled*. The `.asd` file's component list doubles as a suggested reading order.

### One thread per request, and the "current" request

Hunchentoot handles each connection in its own thread. For each request, it binds two special variables in that thread, `*request*` and `*reply*`. So the "starred" accessors work without passing anything around: `(ht:header-in* :origin)` reads a header of the current request, and `(setf (ht:return-code*) 404)` sets the status. Whatever a route function *returns* becomes the response body. There's no response object to build.[^routes]

easy-routes adds URL templates like `/admin/sites/:id` and *decorators*: functions of the form `(lambda (next) …)` that can work before or after calling the route, or answer themselves. This one refuses cross-site form posts:

```lisp
(defun @same-origin (next)
  "Reject state-changing requests that don't come from our own pages."
  (if (origin-ok-p)
      (funcall next)
      (error-page 403 "Forbidden" "This form must be submitted from comments pages.")))
```

### Macros that make the safe way the only way

A route needs the right decorators, and a forgotten CSRF check is silent until someone exploits it. So rf-comments never defines a POST route directly. It uses a macro that puts the check first, every time:

```lisp
(defmacro defaction (name (path &key decorators) params &body body)
  "Define a POST route. The same-origin check always runs first, then
no-store caching and the default headers, then DECORATORS."
  `(progn
     (pushnew ,path *actions* :test #'string=)
     (easy-routes:defroute ,name (,path :method :post
                                        :decorators (@same-origin @no-cache @page-headers
                                                     ,@decorators))
         ,params
       ,@body)))
```

A test then enforces the rule for code not written yet. It walks easy-routes' table of routes and fails if any POST route doesn't start with `@same-origin`:

```lisp
(test every-post-route-is-a-csrf-protected-action
  (let ((posts '()))
    (maphash (lambda (name route)
               (when (eq :post (easy-routes::required-method route))
                 (push name posts)
                 (is (eq 'rf-comments::@same-origin
                         (first (easy-routes::route-decorators route)))
                     "POST route ~a does not run @same-origin first" name)))
             easy-routes::*routes*)
    (is (= (length posts) (length rf-comments::*actions*)))
    (is (>= (length posts) 13))))
```

A second test sends a cross-site POST to every route on the `*actions*` list and expects each one to be refused with 403.

### Special variables and threads

Settings are *special variables*, defined with `defvar` and named with `*earmuffs*`. `defvar` only assigns when the variable is unbound, so reloading the file in a live REPL keeps any values you've already set. The trap is threads. `(let ((*port* 9000)) …)` rebinds a special variable only in the current thread, and Hunchentoot handles each request in a new thread, which sees the *global* value. So a server-wide setting must be changed with `setf`, not `let`. The tests have a `with-globals` macro for exactly this reason.[^config]

### HTML as s-expressions

Spinneret turns Lisp lists into HTML, escaping text by default, so a comment can't inject markup. Tags are keywords, and `.class` suffixes add classes. This is the page an email link opens:

```lisp
(html-page (:title title)
  (:main.page.narrow
   (:h1 title)
   (:p message)
   (when excerpt (:blockquote.rf-muted (truncate-string excerpt 280)))
   (:form :method "post" :action action
          (:input :type "hidden" :name "token" :value token)
          (:button :type "submit" button))))
```

Because it's all ordinary Lisp, `when` and helper functions mix freely with the tags.

### Observers for free, with CLOS

Publishing a comment should also write an audit log entry and email the admin. rf-comments doesn't call those from each operation. The operations are *generic functions*, and the side effects are `:after` methods attached to them:

```lisp
(defgeneric publish-comment (comment by)
  (:method-combination observed)
  (:documentation "Make COMMENT visible on its page."))

(defmethod publish-comment :after (comment by)
  (log-moderation comment "publish" by))

;; Only when the commenter publishes, not when the admin moderates.
(defmethod publish-comment :after (comment (by (eql :author)))
  (notify-admin-of-comment comment))
```

The primary method only updates the database. New reactions attach without touching the operation or its callers, even from a live REPL. The `(eql :author)` *specializer* replaces an `if`: "admin actions don't send email" becomes a fact of method dispatch.

`observed` is a custom method combination, defined with the long form of [`define-method-combination`](https://www.lispworks.com/documentation/HyperSpec/Body/m_defi_4.htm). It's the standard combination with one change: each `:after` method runs inside its own `handler-case`. So a failing email is logged and never breaks the request, while an error in the database update still fails it, as it should.[^events]

### One executable

Lisp has no separate link step. `build.lisp` loads everything into a running image, including the static JavaScript files already read into memory, then calls `sb-ext:save-lisp-and-die`. That writes the whole heap to disk, together with the SBCL runtime, as one executable. With zstd compression it's about 16 MB instead of about 100. At startup it maps the heap back in, with no compile or load phase.[^build][^sbcl]

```lisp
(sb-ext:save-lisp-and-die "bin/rf-comments"
                          :executable t
                          :toplevel (lambda () (uiop:symbol-call :rf-comments :main))
                          :save-runtime-options nil
                          :compression (and (member :sb-core-compression *features*) t))
```

The Docker image is a multi-stage build. One stage builds the executable, a `test` stage runs the FiveAM suite against the same SBCL and pinned Quicklisp dist, and a slim Debian runtime stage holds just the executable and the C libraries it needs.

## Decisions that mattered

The repository's `DESIGN.md` records each decision and the alternative it rejected.[^design] Five stand out.

**An iframe, not injected HTML.** `embed.js` adds an iframe that auto-resizes, rather than writing comments into the host page. Styles can't leak either way, and forms post straight to the comment service. Every host page is a `ryanfleck.ca` subdomain, so the iframe is *same-site* with its parent, though a different origin. Its `SameSite=Lax` cookies therefore keep working as browsers block third-party cookies.

**Each comment is verified by its own email link.** Anyone can type anyone's email address. So an address being "verified" before doesn't publish new comments: each comment is published only by the link mailed for it.

```mermaid
sequenceDiagram
    accTitle: Publishing a comment
    accDescr: A reader posts a comment, which is saved as pending, and an email with a single-use link is sent. The link opens a page with a button; pressing it publishes the comment, signs the reader in and returns them to the post.
    participant Reader
    participant Thread as Comment iframe
    participant Service as rf-comments
    participant Inbox as Email inbox
    Reader->>Thread: Writes a comment
    Thread->>Service: POST /thread/comment
    Service-->>Thread: Saved, pending
    Service->>Inbox: Single-use link
    Reader->>Service: GET /verify
    Service-->>Reader: A confirm button
    Reader->>Service: POST /verify
    Service-->>Reader: Published, signed in
```

The link only shows a button, and the POST behind it does the work. Corporate mail filters "pre-click" links in email to scan them, and a GET that published the comment would burn the single-use token before the person ever saw it.[^web] Signing in uses the same kind of link, so there's no password database to protect. Tokens and session ids are 256-bit random values, and only their SHA-256 hashes are stored, so a leaked backup can't be replayed.

**CSRF protection from the `Origin` header.** Browsers send an `Origin` header that a hostile page can't forge, so checking it blocks cross-site form posts. That's simpler than a token in every form, and `defaction` makes it impossible to forget. The source says OWASP lists this check as a primary defence. OWASP's current cheat sheet is more cautious: its primary recommendation is a token pattern, and it lists `Origin`/`Referer` verification and `SameSite` cookies as defence in depth.[^owasp] rf-comments has both of those layers, since its cookies are `SameSite=Lax` (`Strict` for the admin).

**Avatars through a proxy.** A Gravatar URL contains a hash of the email address. Anyone can confirm a guessed address by hashing it, and loading the image sends every reader's IP address to Gravatar. So each user gets a random key, pages use `/avatar/<key>`, and the server fetches the image and serves it from its own origin. Only PNG, JPEG, GIF and WebP images are accepted from upstream, because an SVG served from the comment service's own origin could carry script.[^design]

**A live REPL in production, off by default.** Attaching SLY to the running service is the Lisp way to inspect and fix it, but an open REPL port is arbitrary code execution. It starts only when `SLYNK_PORT` is set, with a secret of at least 16 characters, bound to localhost and reached over an SSH tunnel. Out of the box, a client with the wrong secret crashed Slynk's accept thread, which kills a non-interactive Lisp. That would have been a denial of service for anyone who could reach the port. rf-comments wraps it to close the socket, log, and keep serving, and CI checks both cases.

The rest are right-sized for a comment box: SQLite with one connection behind a lock and migrations at startup, rows as property lists rather than classes, and SES called directly with about 60 lines of hand-written SigV4 signing instead of an SDK.

## Comments as a course

The code was written to be read by a Lisp programmer who has never built a web service in Common Lisp. The teaching comments were added on their own branch after the features were done, following three rules:

- **Every file opens with a reader's guide:** what it's for, where it sits in the load order, and why it's built that way.
- **A library is explained where it first appears:** Spinneret in `views.lisp`, Hunchentoot's request model in `routes.lisp`, cl-sqlite's statement lifecycle in `db.lisp`, and method combinations in `events.lisp`.
- **Say why, not what:** name the rejected alternative and what it would cost, such as an open redirect, a mail scanner burning a token, or a thread that can't see a `let` binding.

Two checks kept the comments honest. A guard script read every top-level form on `master` and on the branch with the Lisp reader and compared them. It proved that the 874 added lines changed no code, and it was itself tested by planting a one-character change inside a backquoted macro. And claims about libraries were checked against their source before merging. That caught one error: a comment said Hunchentoot defaults to Latin-1, but version 1.3.1 already defaults to UTF-8.[^briefing]

## What the real world caught

Most of the bugs slipped past the unit tests and showed up only in a real browser, a real container, or a real protocol client:[^briefing]

- **`Origin: null`.** The email confirmation page sent `Referrer-Policy: no-referrer`, which makes browsers send `Origin: null` with its form, and the CSRF check rightly refused it. The fix was `same-origin`, which still keeps the token-bearing URL from leaking to other sites.
- **CSP's `form-action` covers redirects.** After confirming, the POST redirects back to the blog, and `form-action 'self'` blocked that hop. The confirmation page now also allows the comment's own origin.
- **`! cmd` never fails under `set -e`.** Two negative checks in CI would have passed forever. They became `if cmd; then exit 1; fi`, proven by pointing one at a container that should fail it.
- **Docker's port proxy answers before the app does.** Waiting for the published port to accept connections proved nothing, so CI now waits for the service's own "listening" log line.
- **A shadowed variable.** A `let` reused the name `page-id`, so an "invalid id" check could never fire. A test asserting the exact error message caught it.

Every change followed the same loop, written down in the repository's `AGENTS.md`. Plan it, cut a named branch, implement it with tests, and push. GitHub Actions then runs the suite inside the Docker `test` stage, builds the runtime image, and smoke-tests the container. On green, the branch is merged with `--no-ff`, so `master`'s history reads as a list of features. Nine branches went in that way in one day, after the first commit.

## References

[^briefing]: "rf-comments: a Common Lisp web app, built to be read," project briefing, 6 November 2026 (line counts and test checks measured in the repository that day). I re-counted the lines: 3,031 of Lisp code and 1,151 of comments.
[^design]: RyansGhost/comment-storage-system, [`DESIGN.md`](https://github.com/RyansGhost/comment-storage-system/blob/master/DESIGN.md).
[^asd]: RyansGhost/comment-storage-system, [`rf-comments.asd`](https://github.com/RyansGhost/comment-storage-system/blob/master/rf-comments.asd) (reading guide).
[^routes]: RyansGhost/comment-storage-system, [`src/routes.lisp`](https://github.com/RyansGhost/comment-storage-system/blob/master/src/routes.lisp) ("How a request flows through Hunchentoot and easy-routes").
[^config]: RyansGhost/comment-storage-system, [`src/config.lisp`](https://github.com/RyansGhost/comment-storage-system/blob/master/src/config.lisp).
[^events]: RyansGhost/comment-storage-system, [`src/events.lisp`](https://github.com/RyansGhost/comment-storage-system/blob/master/src/events.lisp).
[^build]: RyansGhost/comment-storage-system, [`build.lisp`](https://github.com/RyansGhost/comment-storage-system/blob/master/build.lisp).
[^sbcl]: SBCL User Manual, "Saving a Core Image." <https://www.sbcl.org/manual/#Saving-a-Core-Image>
[^web]: RyansGhost/comment-storage-system, [`src/web.lisp`](https://github.com/RyansGhost/comment-storage-system/blob/master/src/web.lisp) ("Email confirmation").
[^owasp]: OWASP, "Cross-Site Request Forgery Prevention Cheat Sheet." <https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html>
