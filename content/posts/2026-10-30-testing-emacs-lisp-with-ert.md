---
date: 2026-10-30T15:27:27Z
draft: false
title: "Testing Emacs Lisp with ERT: A Field Manual"
description: "What you need to write excellent ERT tests for Emacs Lisp and a robust CI pipeline, using the 53 tests and three-job CI of rcf-sword 0.3.0 as the worked example."
categories:
  - technology
tags:
  - "claude-opus-5.5"
  - emacs
  - elisp
  - testing
  - ci
---

This manual covers what you need to write excellent unit tests for Emacs Lisp, and a CI pipeline that catches problems before your users do. Its running example is [RyansGhost/rcf-sword](https://github.com/RyansGhost/rcf-sword) 0.3.0 (commit [`3b42ff2`](https://github.com/RyansGhost/rcf-sword/commit/3b42ff236bc7ca538be78789d044e635460f168c)). That's a package with 53 ERT tests and a three-job GitHub Actions workflow. Every command and every piece of output below was run for real on GNU Emacs 29.3, and claims about tools are footnoted.

## ERT in one minute

ERT, *Emacs Lisp Regression Testing*, was written by Christian Ohler and has shipped with Emacs since Emacs 24.[^ert-src][^wellons] "Tests are simply Lisp code: code that invokes other code and checks whether it behaves as expected."[^ert-intro] You define a test with `ert-deftest`, and check results with three macros:

- `should` fails unless its form returns non-nil;
- `should-not` fails if its form returns non-nil;
- `should-error` fails unless its form signals an error, optionally of a given `:type`.

```elisp
(ert-deftest rcf-sword-test-superscript ()
  "Verse numbers become superscript digits."
  (should (equal (rcf-sword--superscript 0) "⁰"))
  (should (equal (rcf-sword--superscript 123) "¹²³"))
  (should (equal (rcf-sword--superscript 4567890) "⁴⁵⁶⁷⁸⁹⁰")))
```

That's the whole framework. The rest is technique.

## Writing tests that hold up

### Set up the file properly

```elisp
;;; rcf-sword-test.el --- Tests for rcf-sword  -*- lexical-binding: t; no-byte-compile: t; -*-
```

`lexical-binding: t` matches the package. `no-byte-compile: t` matters if people install your repository with `package-vc`, which byte-compiles every file in it. Without it, users would see warnings from a test file that isn't part of the package.[^tests] The file requires `ert` and the package, and ends with `(provide 'rcf-sword-test)`, so `-l rcf-sword-test` can load it by name.

Group tests into sections by feature, and give every test a docstring saying what it checks, such as "A bad reference inserts nothing and leaves the buffer unchanged." ERT shows it beside a failure, so the failure explains itself.

### Make pure functions, and test them with tables

The easiest code to test takes input and returns output, with no side effects.[^ert-techniques] Keep parsing and formatting in small pure functions, and most tests become tables. Loop over them, and compare `(cons input actual)` with `(cons input expected)`, so a failure names the input that broke:

```elisp
(ert-deftest rcf-sword-test-reference-spans ()
  "References parse into spans of chapters and verses."
  (pcase-dolist (`(,input ,parsed)
                 '(("Genesis 6:1-2" ("Genesis" ((6 1 6 2))))
                   ("  1 Cor 13:4-7 " ("1 Cor" ((13 4 13 7))))
                   ("John 3:16-4:2" ("John" ((3 16 4 2))))
                   ("Ps 23:1,4" ("Ps" ((23 1 23 1) (23 4 23 4))))
                   ("Jude" nil)))
    (should (equal (cons input (rcf-sword--reference-spans input))
                   (cons input parsed)))))
```

Tables also make refactors safe. When rcf-sword swapped the `s.el` library for built-in functions, a one-off script compared the old and new code over about 90 tricky inputs (17,383 comparisons, all matching). The interesting cases then became permanent tests.[^readme] That's what *regression* testing means: once behaviour is right, a test keeps it right.

### Build fixtures from functions and macros

ERT has no set-up/tear-down framework, on purpose. Fixtures "are a useful syntactic simplification in other languages, [but] this does not apply to Lisp, where higher-order functions and `unwind-protect` are available."[^ert-fixtures] rcf-sword's tests need a real SQLite file. A function builds one, and a macro binds it, runs the body, and always cleans up:

```elisp
(defun rcf-sword-test--make-db (name abbreviation verses)
  "Return a new temporary .bblx file for translation NAME (ABBREVIATION).
It contains VERSES, a list of (BOOK CHAPTER VERSE TEXT)."
  (let* ((file (make-temp-file "rcf-sword-test" nil ".bblx"))
         (db (sqlite-open file)))
    ;; ... CREATE TABLE Bible and Details, then INSERT each verse ...
    (sqlite-close db)
    file))

(defmacro rcf-sword-test--with-db (&rest body)
  "Run BODY with `rcf-sword-bblx-file' bound to a fixture database."
  (declare (indent 0) (debug t))
  `(let* ((file (rcf-sword-test--make-db "King James Version" "KJV"
                                         rcf-sword-test--verses))
          (rcf-sword-bblx-file file))
     (unwind-protect
         (progn
           (rcf-sword-close-database)
           ,@body)
       (rcf-sword-close-database)
       (delete-file file))))
```

Three details matter here:

- **The macro `let`-binds the package's setting** instead of setting it, so a test can't leak configuration into your editor.
- **Because the builder is a function**, a test can make a second database, as the translation-switching test does.
- **The fixture *data* is chosen to test edge cases.** Psalms has only chapters 1, 2 and 23, so navigation must skip missing chapter numbers. One verse is from a book missing from the default book list.

Since Emacs 29, `ert-x` also provides `ert-with-temp-file` and `ert-with-temp-directory`, which create, bind and delete for you.[^ertx]

### Leave the environment as you found it

"Each test should leave its environment in the same state it found it in."[^ert-env] The ERT manual recommends specific tools for this:

| Problem | Use | In rcf-sword |
| :- | :- | :- |
| Code changes the current buffer | `with-temp-buffer` | Every insertion test |
| Code changes windows | `save-window-excursion` | The reader, search and translation tests |
| Behaviour depends on a setting | `let`-bind the variable | `(let ((rcf-sword-md-link-reference t)) ...)` |
| Anything else must be undone | `unwind-protect` | Fixtures; killing reader buffers |

Avoid heavily customisable commands like `find-file` in tests. Use `with-temp-buffer` and call the major mode directly, as in `(with-temp-buffer (org-mode) ...)`.[^ert-env]

### Stub the prompts, not the logic

A test can't type into a prompt, so replace the prompt function for the length of one form with `cl-letf`. This stub returns its own arguments, so the test checks what the prompt *would* show:

```elisp
(with-temp-buffer
  (insert "Read Ps 23 today")
  (goto-char 8)
  (cl-letf (((symbol-function 'read-string)
             (lambda (prompt _initial history default)
               (list prompt history default))))
    (should (equal (rcf-sword--read-reference "Enter verse")
                   '("Enter verse (default Ps 23): "
                     rcf-sword-reference-history "Ps 23")))))
```

The same move answers `completing-read`, and stubbing `require` with `#'ignore` simulates a missing optional package. Keep stubs small: until the form exits, *every* caller in Emacs gets the stub. It works for ordinary functions, even C ones like `read-string`. It doesn't work for primitives the byte compiler turns into opcodes, such as `car` or `+`.

### Pass in the clock

If a function depends on the time, the random number generator or the environment, let callers hand that in. rcf-sword's verse of the day takes an optional time, so the test needs no clock mocking:

```elisp
(let* ((morning (encode-time '(0 0 8 30 10 2026 nil nil nil)))
       (evening (encode-time '(0 0 22 30 10 2026 nil nil nil)))
       (tomorrow (encode-time '(0 0 8 31 10 2026 nil nil nil)))
       (today (rcf-sword--verse-of-the-day morning)))
  (should (equal (rcf-sword--verse-of-the-day evening) today))
  (should-not (equal (rcf-sword--verse-of-the-day tomorrow) today)))
```

### Test randomness by its distribution

A random verse should be drawn evenly from every verse. Test the counts over many draws, with bounds wide enough that chance never fails the build:

```elisp
(let ((counts (make-hash-table :test #'equal))
      (n (length rcf-sword-test--verses)))
  (dotimes (_ (* 100 n))
    (cl-incf (gethash (butlast (car (rcf-sword--random-verse))) counts 0)))
  (should (= (hash-table-count counts) n))
  (maphash (lambda (_verse n) (should (< 50 n 160))) counts))
```

With 10 verses there are 1,000 draws. Each verse expects about 100, with a standard deviation of about 9.5. The bounds sit over five standard deviations out, and the exact binomial odds of a fair picker failing are below one in 11 million runs. A picker that chose a book first, then a verse, fails easily, because a verse alone in its book comes up far too often. Wide bounds keep a statistical test from being a flaky one.

### Test through the keys people press

For modes with key bindings, look the key up and run whatever it's bound to. One line then tests both the binding and the command:

```elisp
(call-interactively (keymap-lookup nil "]"))  ; next chapter in the reader
```

`keymap-lookup` (Emacs 29) searches the current buffer's active keymaps when its first argument is `nil`.[^news29]

### Check that related pieces agree

Some bugs are two parts of a package drifting apart. rcf-sword offers the same commands in a prefix keymap and a transient menu, so one test walks the map and checks the menu:

```elisp
(map-keymap
 (lambda (key command)
   (should (commandp command))
   (unless (eq command #'rcf-sword-menu)
     (should (memq command (flatten-tree (transient-get-suffix
                                          'rcf-sword-menu (string key)))))))
 rcf-sword-command-map)
```

Data gets the same treatment: every entry in the customizable table of book abbreviations must resolve to a real book.

### Skip what can't run, rather than fail

Tests that need optional packages say so first:

```elisp
(ert-deftest rcf-sword-test-insert-markdown ()
  (skip-unless (require 'markdown-mode nil t))
  ...)
```

In a bare `emacs -Q`, those tests are skipped, and the run still succeeds:

```text
Ran 53 tests, 50 results as expected, 0 unexpected, 3 skipped (2026-10-30 22:46:47+0000, 1.236797 sec)

3 skipped results:
  SKIPPED  rcf-sword-test-insert-markdown
  SKIPPED  rcf-sword-test-markdown-footnotes
  SKIPPED  rcf-sword-test-reader-margins
```

Emacs 30 adds `skip-when`. Stick to `skip-unless` if you support Emacs 29.[^ert-env]

### Test the package's promises in a fresh Emacs

Loading a package shouldn't *do* anything. You can't check that inside the test session, because other tests have already loaded Org, markdown-mode and more. So start a fresh Emacs, the same binary, and ask it:

```elisp
(ert-deftest rcf-sword-test-loading-has-no-side-effects ()
  "Loading rcf-sword opens no database and loads no optional packages.
This runs in a fresh Emacs, because this one has loaded Org,
markdown-mode and more for other tests."
  (let ((dir (file-name-directory (locate-library "rcf-sword"))))
    (with-temp-buffer
      (call-process (expand-file-name invocation-name invocation-directory)
                    nil '(t nil) nil "-Q" "--batch" "-L" dir "--eval"
                    (prin1-to-string
                     '(progn (require 'rcf-sword)
                             (prin1 (list rcf-sword--db (featurep 'org)
                                          (featurep 'markdown-mode)
                                          (featurep 'olivetti)
                                          (featurep 'bookmark))))))
      (should (equal (buffer-string) "(nil nil nil nil nil)")))))
```

`invocation-name` and `invocation-directory` name the running Emacs, so each version in a CI matrix checks itself. A second test, `(should-not (featurep 's))`, guards the promise of no third-party dependencies. CI checks the same promise from outside by [installing the package into a clean Emacs](#the-pipeline).

### Check error messages word for word, and mind the locale

Friendly errors are part of the interface, so test the exact text. A small helper returns a `user-error`'s message:

```elisp
(defun rcf-sword-test--user-error (function &rest args)
  "Call FUNCTION with ARGS and return its `user-error' message, or nil."
  (condition-case err
      (progn (apply function args) nil)
    (user-error (error-message-string err))))
```

There's a trap. `user-error`, `message` and `error` pass their format string through `format-message`. It replaces each grave accent (`` ` ``) and apostrophe (`'`) with curved quotes "if curved single quotes are displayable", which depends on the locale.[^quoting] rcf-sword hit this: four message tests passed locally and failed in CI's UTF-8 locale.[^v030] A one-test demonstration fails only under `LANG=C.UTF-8`, and ERT points straight at the culprit:

```text
      :form
      (equal "There’s no verse 9" "There's no verse 9")
      :value nil :explanation
      (array-elt 5
		 (different-atoms
		  (8217 "#x2019" "?’")
		  (39 "#x27" "?'")))))
```

The fix is to build the text with plain `format`, which never curls quotes, and pass it in as an argument:

```elisp
(user-error "%s" (format "%s ends at chapter %d, so there's no chapter %d"
                         name last-chapter chapter))
```

Run your tests under a UTF-8 locale locally too, so they behave as they do in CI.

## When a test fails

ERT's failure reports are its best feature. Given a deliberately wrong test:

```elisp
(ert-deftest demo-superscript-wrong ()
  (should (equal (rcf-sword--superscript 12) "¹³")))
```

it shows the form, the values, and an *explanation* of exactly where they differ, here element 1 of the string:

```text
      :form
      (equal "¹²" "¹³")
      :value nil :explanation
      (array-elt 1
		 (different-atoms
		  (178 "#xb2" "?²")
		  (179 "#xb3" "?³")))))
   FAILED  3/3  demo-superscript-wrong (0.000118 sec) at demo-test.el:5
```

Explanations work for `equal`, `eql` and friends inside `should`, and walk into lists, strings and vectors.[^ert-explain] Two more tools:

- **`:expected-result :failed`** marks a known bug. ERT stays quiet while it fails, and tells you when it starts passing.[^ert-expected]
- **`:tags`**, such as `:tags '(:slow)`, lets you select tests by tag.[^ert-selectors]

## Running tests

### Interactively

Load the package and tests (for example with `M-x eval-buffer`), then `M-x ert RET t RET`. The `*ert*` buffer shows one character per test: `.` passed, `f` expected failure, `F` unexpected failure. On a test, <kbd>r</kbd> re-runs it, <kbd>d</kbd> re-runs it with the debugger, <kbd>b</kbd> shows the backtrace, <kbd>m</kbd> shows its messages, and <kbd>.</kbd> jumps to its definition.[^ert-interactive]

ERT runs whatever tests are *currently defined*, so a renamed test lingers until you delete it (<kbd>D</kbd>) or restart. Batch runs start fresh every time, which makes them the source of truth.

### In batch mode

This is the form every CI setup builds on. It "will exit with a zero exit status if all tests passed, or nonzero if any tests failed or if anything else went wrong":[^ert-batch]

```sh
emacs -Q --batch -L . -L test -l rcf-sword-test -f ert-run-tests-batch-and-exit
```

- **`-Q`** skips your init files. If a test only passes with your config, it's testing your config.
- **`-L .` and `-L test`** put the source and tests on `load-path`.
- **`-f ert-run-tests-batch-and-exit`** runs every test and sets the exit status.

```text
Running 53 tests (2026-10-30 22:46:35+0000, selector ‘t’)
   passed   1/53  rcf-sword-test-book-aliases (0.000659 sec)
   ...
   passed  53/53  rcf-sword-test-verse-of-the-day (0.017385 sec)

Ran 53 tests, 53 results as expected, 0 unexpected (2026-10-30 22:46:38+0000, 2.929419 sec)
```

To run a subset, pass a *selector*. A string is a regexp on test names, and selectors combine with `and`, `or` and `not`, along with `(tag ...)`:[^ert-selectors]

```sh
emacs -Q --batch -L . -L test -l rcf-sword-test \
  --eval '(ert-run-tests-batch-and-exit (quote (and "reader" (not "margins"))))'
# Ran 4 tests, 4 results as expected, 0 unexpected
```

Useful output controls, all from the manual's batch section:[^ert-batch]

| Want | Use |
| :- | :- |
| Only failures and the summary | `(let ((ert-quiet t)) (ert-run-tests-batch-and-exit))` |
| Bigger printed values in failures | Bind `ert-batch-print-level` and `ert-batch-print-length` |
| A JUnit XML report (Emacs 29+) | Set the `EMACS_TEST_JUNIT_REPORT` environment variable |

With the JUnit variable set, ERT writes one report per test file, next to it. For rcf-sword that's `test/rcf-sword-test.xml`, which CI systems can display:[^news29][^ert-junit]

```xml
<testsuites name="rcf-sword-test.xml" tests="53" errors="0" failures="0" skipped="0" time="1.527763263">
```

### Tools that wrap ERT

A Makefile is the smallest dependable runner. rcf-sword's has `compile`, `checkdoc`, `lint` and `test` targets, and installs development dependencies into a private `./.elpa`, never your own `~/.emacs.d`. When you want more, several tools build on ERT:

| Tool | Author | What it gives you |
| :- | :- | :- |
| [Cask](https://github.com/cask/cask) | Johan Andersson, with Sebastian Wiesner and Takafumi Arakaki[^cask-src] | Development dependencies. It now recommends `cask emacs --batch ... -f ert-run-tests-batch`, and no longer recommends `cask exec ert-runner`.[^cask] |
| [Eldev](https://github.com/emacs-eldev/eldev) | Paul Pogonyshev[^eldev] | An Emacs-based build tool. `eldev test` runs ERT, Buttercup, Doctest and Ecukes.[^eldev-doc] |
| [Eask](https://github.com/emacs-eask/cli) | Jen-Chieh Shen[^eask] | A CLI with `eask test ert`, `eask compile` and a ready-made GitHub Actions setup.[^eask-gha] |
| [makem.sh](https://github.com/alphapapa/makem.sh) | Adam Porter | One script that "helps to build, lint, and test Emacs Lisp packages", optionally in a sandbox.[^makem] |

[Buttercup](https://github.com/jorgenschaefer/emacs-buttercup), by Jorgen Schäfer and Ola Nilsson, is an alternative framework with Jasmine-style `describe`/`it` blocks.[^buttercup] [undercover.el](https://github.com/undercover-el/undercover.el) adds coverage reports, for code that isn't byte-compiled.[^undercover]

## A robust CI pipeline

### The pipeline

Steve Purcell's [setup-emacs](https://github.com/purcell/setup-emacs) action installs any Emacs release from 23.4 on Linux, using his [nix-emacs-ci](https://github.com/purcell/nix-emacs-ci) builds.[^setup-emacs][^nix-emacs-ci] For Windows, Jen-Chieh Shen's [setup-emacs](https://github.com/jcs090218/setup-emacs) works too.[^setup-emacs-jcs] This is rcf-sword's whole workflow, with its comments shortened:

```yaml
name: CI

on:
  push:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        # The oldest supported version, the latest of each release since,
        # and the development snapshot for early warning of breakage.
        emacs_version: ["29.1", "29.4", "30.2", "31.1", "snapshot"]
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - uses: purcell/setup-emacs@bdc64dc730ae1fcba200bfd52cb1b4cf6159cbe5 # v8.0
        with:
          version: ${{ matrix.emacs_version }}
      - name: Byte-compile, checkdoc, package-lint and ERT
        run: make all

  release-tag:
    # On a release tag, check it names the version in the file's header.
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - name: Tag matches the Version header
        run: |
          version=$(sed -n 's/^;; Version: //p' rcf-sword.el)
          if [ "v$version" != "$GITHUB_REF_NAME" ]; then
            echo "::error::Tag $GITHUB_REF_NAME doesn't match ';; Version: $version' in rcf-sword.el"
            exit 1
          fi

  vanilla-install:
    # Install the package as the README's quick start does, in an Emacs
    # with no config and only the default package archives.
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - uses: purcell/setup-emacs@bdc64dc730ae1fcba200bfd52cb1b4cf6159cbe5 # v8.0
        with:
          version: "29.1"
      - name: Install with package-vc and check the autoloads
        run: |
          set -euo pipefail
          export HOME=$(mktemp -d)
          emacs --batch --eval "(package-vc-install-from-checkout \"$PWD\" \"rcf-sword\")" 2>&1 | tee install.log
          if grep -Ei "warning|error|failed" install.log; then
            echo "::error::Installing rcf-sword printed warnings or errors"; exit 1
          fi
          # After a restart, the commands are autoloaded but nothing is loaded.
          emacs --batch --eval "(progn
            (package-activate-all)
            (unless (and (autoloadp (symbol-function 'rcf-sword-insert-verse))
                         (not (featurep 'rcf-sword)))
              (error \"rcf-sword's commands aren't autoloaded\")))"
```

### What makes it robust

- **CI runs the same commands as your laptop.** The test job just runs `make all`, so a local `make` reproduces any failure. Its four targets are byte-compiling with warnings as errors, `checkdoc`, `package-lint` and the tests. Many bugs, like free variables, typos in function names and wrong argument counts, show up as compiler warnings before any test hits them.
- **The matrix covers the oldest supported Emacs, the latest release of each version since, and the snapshot.** 29.1 is the version in `Package-Requires`, so the promise to users is checked. `fail-fast: false` stops one failure from hiding the others. This matrix caught a real change: Emacs 31.1 made `if-let` and `when-let` obsolete ("Use 'if-let*', 'when-let*' and 'and-let*' instead").[^news31] Under warnings-as-errors, the 31.1 and snapshot jobs failed while 29 and 30 passed. The fix was to use `if-let*`.[^v030]
- **It installs the package the way users do.** The `vanilla-install` job gives Emacs an empty `HOME`, installs the checkout with `package-vc`, and fails on any warning. Then a second, fresh Emacs checks that the commands are autoloaded, but the package isn't loaded yet. A dependency that isn't built in fails here, not for a user. Putting the old `s.el` dependency back produced "Failed to install the following dependencies: s".[^v030] Running it locally also shows `no-byte-compile` at work: the install compiles the package files and skips the test file.
- **Release tags must match the code.** Emacs packages declare their version in a `;; Version:` header, and a git tag can point at the wrong commit. rcf-sword's own `v0.2.1` tag marks a commit whose header says 0.2.0. The `release-tag` job fails any `v*` tag that doesn't match.
- **Actions are pinned to commit SHAs.** GitHub recommends pinning third-party actions to a full commit SHA, because "a tag can be moved or deleted if a bad actor gains access to the repository storing the action."[^gh-pin] A comment keeps the release name readable. A `.github/dependabot.yml` asks Dependabot to propose updates monthly, so pinned actions don't go stale:[^dependabot]

  ```yaml
  version: 2
  updates:
    - package-ecosystem: github-actions
      directory: /
      schedule:
        interval: monthly
  ```

### Add a JUnit report

One more step makes failures readable in the CI interface, not just in logs. Set the JUnit variable, and upload the report even when tests fail:

```yaml
      - name: Byte-compile, checkdoc, package-lint and ERT
        run: make all
        env:
          EMACS_TEST_JUNIT_REPORT: "1"
      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v4  # pin this to a SHA too
        with:
          name: ert-report-${{ matrix.emacs_version }}
          path: test/*.xml
```

### GitLab CI

Silex's [docker-emacs](https://github.com/Silex/docker-emacs) images wrap nix-emacs-ci, and their `-ci` tags add `git` and `make`.[^docker-emacs] GitLab reads JUnit files natively. With `when: always`, failed runs still upload their report, and the job passes or fails on the script's exit status.[^gitlab]

```yaml
test:
  image: silex/emacs:${EMACS_VERSION}-ci
  parallel:
    matrix:
      - EMACS_VERSION: ["29.4", "30.2"]
  variables:
    EMACS_TEST_JUNIT_REPORT: "1"
    LANG: C.UTF-8  # the same locale everywhere, for message tests
  script:
    - make all
  artifacts:
    when: always
    reports:
      junit: test/*.xml
```

## Checklist

**Writing tests**

- [ ] `lexical-binding: t`, plus `no-byte-compile: t` if the repository is installed with `package-vc`.
- [ ] Test names start with the package prefix; every test has a docstring; tests are grouped by feature.
- [ ] Logic lives in small pure functions, tested with input/expected tables.
- [ ] Fixtures are functions and macros (or `ert-with-temp-file`) that always clean up.
- [ ] Settings are `let`-bound, never `setq`; buffers, windows and files are restored.
- [ ] Prompts are stubbed with `cl-letf` around the smallest possible form.
- [ ] Time, randomness and other outside state are passed in as arguments.
- [ ] Random behaviour is tested by its distribution, with bounds that never flake.
- [ ] Commands are driven through their key bindings, and keymaps, menus and tables are checked against each other.
- [ ] Optional dependencies use `skip-unless`.
- [ ] Load-time behaviour is tested in a fresh Emacs.
- [ ] User-facing messages are checked word for word, without apostrophes in `user-error` format strings.
- [ ] Known bugs are marked `:expected-result :failed`, not deleted.

**CI**

- [ ] `make all` (or your tool) runs the same commands locally and in CI, in `emacs -Q --batch`, under a UTF-8 locale.
- [ ] Byte-compilation treats warnings as errors, and `checkdoc` and `package-lint` run beside the tests.
- [ ] The matrix goes from your minimum Emacs, through the latest of each release, to the snapshot, with `fail-fast: false`.
- [ ] A job installs the package into a clean Emacs and checks its autoloads.
- [ ] Release tags are checked against the `Version:` header.
- [ ] Actions are pinned to commit SHAs, with Dependabot proposing updates.
- [ ] A JUnit report is published, even when tests fail.

## References

[^ert-src]: GNU Emacs source, [`lisp/emacs-lisp/ert.el`](https://github.com/emacs-mirror/emacs/blob/emacs-29/lisp/emacs-lisp/ert.el) (file header: "Author: Christian Ohler").
[^wellons]: C. Wellons, "Elisp Unit Testing with ERT," *null program*, 15 August 2012. <https://nullprogram.com/blog/2012/08/15/>
[^ert-intro]: *ERT: Emacs Lisp Regression Testing* (GNU manual), "Introduction." <https://www.gnu.org/software/emacs/manual/html_node/ert/Introduction.html>
[^tests]: RyansGhost/rcf-sword, [`test/rcf-sword-test.el`](https://github.com/RyansGhost/rcf-sword/blob/master/test/rcf-sword-test.el) (file commentary).
[^ert-techniques]: ERT manual, "Useful Techniques when Writing Tests." <https://www.gnu.org/software/emacs/manual/html_node/ert/Useful-Techniques.html>
[^readme]: RyansGhost/rcf-sword README, "Interesting notes." <https://github.com/RyansGhost/rcf-sword#interesting-notes>
[^ert-fixtures]: ERT manual, "Fixtures and Test Suites." <https://www.gnu.org/software/emacs/manual/html_node/ert/Fixtures-and-Test-Suites.html>
[^ertx]: GNU Emacs source, [`lisp/emacs-lisp/ert-x.el`](https://github.com/emacs-mirror/emacs/blob/emacs-29/lisp/emacs-lisp/ert-x.el): `ert-with-temp-file` and `ert-with-temp-directory` are present on the emacs-29 branch and absent on emacs-28.
[^ert-env]: ERT manual, "Tests and Their Environment." <https://www.gnu.org/software/emacs/manual/html_node/ert/Tests-and-Their-Environment.html>
[^news29]: GNU Emacs 29 NEWS (new `keymap-*` functions; "ERT can generate JUnit test reports"). <https://github.com/emacs-mirror/emacs/blob/emacs-29/etc/NEWS>
[^quoting]: GNU Emacs 29 docstrings of `format-message` and `text-quoting-style` (`C-h f format-message`, `C-h v text-quoting-style`), and the Elisp manual, "Text Quoting Style." <https://www.gnu.org/software/emacs/manual/html_node/elisp/Text-Quoting-Style.html>
[^v030]: RyansGhost/rcf-sword, "rcf-sword 0.3.0: reader navigation, search, translations, Org links and more" (#5), commit notes "Fix CI: keep apostrophes in messages straight in UTF-8 locales", "Fix CI on Emacs 31: use if-let* and when-let*" and "CI: install the package into a vanilla Emacs". <https://github.com/RyansGhost/rcf-sword/commit/3b42ff236bc7ca538be78789d044e635460f168c>
[^ert-explain]: ERT manual, "Understanding Explanations." <https://www.gnu.org/software/emacs/manual/html_node/ert/Understanding-Explanations.html>
[^ert-expected]: ERT manual, "Expected Failures." <https://www.gnu.org/software/emacs/manual/html_node/ert/Expected-Failures.html>
[^ert-selectors]: ERT manual, "Test Selectors." <https://www.gnu.org/software/emacs/manual/html_node/ert/Test-Selectors.html>
[^ert-interactive]: ERT manual, "Running Tests Interactively." <https://www.gnu.org/software/emacs/manual/html_node/ert/Running-Tests-Interactively.html>
[^ert-batch]: ERT manual, "Running Tests in Batch Mode." <https://www.gnu.org/software/emacs/manual/html_node/ert/Running-Tests-in-Batch-Mode.html>
[^ert-junit]: GNU Emacs source, `ert-write-junit-test-report` in [`ert.el`](https://github.com/emacs-mirror/emacs/blob/emacs-29/lisp/emacs-lisp/ert.el).
[^cask-src]: Cask source, [`cask.el`](https://github.com/cask/cask/blob/master/cask.el) (copyright: Johan Andersson; Sebastian Wiesner; Takafumi Arakaki).
[^cask]: Cask README. <https://github.com/cask/cask>
[^eldev]: P. Pogonyshev, Eldev (`eldev.el` header). <https://github.com/emacs-eldev/eldev>
[^eldev-doc]: Eldev documentation, "Testing." <https://emacs-eldev.github.io/eldev/>
[^eask]: J. Shen, Eask CLI (`package.json` author; `eask test ert` command). <https://github.com/emacs-eask/cli>
[^eask-gha]: Eask documentation, "GitHub Actions." <https://emacs-eask.github.io/Continuous-Integration/GitHub-Actions/>
[^makem]: A. Porter, makem.sh README. <https://github.com/alphapapa/makem.sh>
[^buttercup]: J. Schäfer and O. Nilsson, Buttercup README and `buttercup.el` header. <https://github.com/jorgenschaefer/emacs-buttercup>
[^undercover]: S. Alexander and V. Panteleev, undercover.el README. <https://github.com/undercover-el/undercover.el>
[^setup-emacs]: S. Purcell, setup-emacs README. <https://github.com/purcell/setup-emacs>
[^nix-emacs-ci]: S. Purcell, nix-emacs-ci README ("Official release versions from 23.4 are supported on Linux"). <https://github.com/purcell/nix-emacs-ci>
[^setup-emacs-jcs]: J. Shen, setup-emacs README. <https://github.com/jcs090218/setup-emacs>
[^news31]: GNU Emacs 31 NEWS, "'if-let' and 'when-let' are now obsolete." <https://github.com/emacs-mirror/emacs/blob/emacs-31/etc/NEWS>
[^gh-pin]: GitHub Docs, "Security hardening for GitHub Actions: Using third-party actions." <https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions#using-third-party-actions>
[^dependabot]: GitHub Docs, "Keeping your actions up to date with Dependabot." <https://docs.github.com/en/code-security/dependabot/working-with-dependabot/keeping-your-actions-up-to-date-with-dependabot>
[^docker-emacs]: Silex, docker-emacs README. <https://github.com/Silex/docker-emacs>
[^gitlab]: GitLab Docs, "Unit test reports." <https://docs.gitlab.com/ci/testing/unit_test_reports/>
