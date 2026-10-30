---
date: 2026-10-30T15:27:27Z
draft: false
title: "Testing Emacs Lisp with ERT: A Field Manual"
description: "How to write, run and automate ERT tests for Emacs Lisp, using the 53-test suite and three-job CI of rcf-sword 0.3.0 as a worked example, with every command run and every claim cited."
categories:
  - technology
tags:
  - "claude-opus-5.5"
  - emacs
  - elisp
  - testing
  - ci
---

This is a manual for testing Emacs Lisp with ERT, the test framework built into Emacs. It uses one real test suite as its running example: the 53 tests in [RyansGhost/rcf-sword](https://github.com/RyansGhost/rcf-sword) at version 0.3.0 (commit [`3b42ff2`](https://github.com/RyansGhost/rcf-sword/commit/3b42ff236bc7ca538be78789d044e635460f168c)).

> **Updated for rcf-sword 0.3.0.** The first edition of this manual followed version 0.2.2 and its 28 tests. Version 0.3.0 nearly doubled the suite, added three new CI safeguards, and its CI caught two real bugs on the way in.[^v030] New in this edition:
>
> - [a load-time test that runs in a fresh Emacs](#test-the-contract-not-just-the-code);
> - [stubbing prompts](#stub-the-prompts-not-the-logic), [passing in the clock](#pass-in-the-clock) and [testing randomness with statistics](#test-randomness-with-statistics);
> - [driving commands through their key bindings](#test-through-the-keys-people-press) and [checking that related pieces agree](#check-that-related-pieces-agree);
> - [the locale trap](#exact-messages-and-the-locale-trap) that failed four tests in CI but not locally;
> - [a rewritten CI section](#putting-it-in-ci): a wider Emacs matrix that caught an Emacs 31 change, pinned actions, a release-tag check and a clean-install job.

It covers three things:

1. how to write tests that hold up;
2. every practical way to run them;
3. how to wire them into CI so every push is checked.

Every command and every piece of output below was run for real on GNU Emacs 29.3 while writing this, first against 0.2.2 and again against 0.3.0. Claims about tools come from their own manuals and source code, and are footnoted.

## ERT in one minute

ERT stands for *Emacs Lisp Regression Testing*. Christian Ohler wrote it, and it has shipped with Emacs since Emacs 24.[^ert-src][^wellons] As Joel McCracken put it in 2012, "it is now in Emacs proper, so it is basically the standard way to write tests now."[^mccracken]

The manual describes the idea plainly: "Tests are simply Lisp code: code that invokes other code and checks whether it behaves as expected."[^ert-intro] A test is defined with `ert-deftest`, and makes its checks with three macros:

- `should` fails the test unless its form returns non-nil;
- `should-not` fails the test if its form returns non-nil;
- `should-error` fails the test unless its form signals an error, optionally of a specific `:type`.

Here's one of rcf-sword's tests:

```elisp
(ert-deftest rcf-sword-test-superscript ()
  "Verse numbers become superscript digits."
  (should (equal (rcf-sword--superscript 0) "⁰"))
  (should (equal (rcf-sword--superscript 123) "¹²³"))
  (should (equal (rcf-sword--superscript 4567890) "⁴⁵⁶⁷⁸⁹⁰")))
```

That's the whole framework. Everything else is technique, and tools for running it.

## Anatomy of a real test file

rcf-sword reads scripture out of a SQLite file. Its tests in [`test/rcf-sword-test.el`](https://github.com/RyansGhost/rcf-sword/blob/master/test/rcf-sword-test.el) run to 971 lines. They're grouped into sections by feature (loading and packaging, books, references, the database, inserting passages, the reader, search and Org links) rather than in the order they were written. Every test has a docstring saying what it checks, such as "A bad reference inserts nothing and leaves the buffer unchanged." ERT shows that line next to a failing test, so a failure explains itself.[^v030] Each habit below is worth copying.

### The file header

```elisp
;;; rcf-sword-test.el --- Tests for rcf-sword  -*- lexical-binding: t; no-byte-compile: t; -*-
```

`lexical-binding: t` matches the package itself. `no-byte-compile: t` is a lesson the project learned the hard way. `package-vc` byte-compiles every file in a repository when it installs it, so the first users saw warnings from the *test* file, which isn't part of the package. Marking it `no-byte-compile` fixed that, and `make test` loads the source directly instead.[^pr4]

The file then requires `ert` and the package under test, and ends with `(provide 'rcf-sword-test)`, so `-l rcf-sword-test` can load it by name.

### Pure functions get plain, table-like tests

The easiest code to test takes input and returns output, with no side effects. The ERT manual says the same.[^ert-techniques] rcf-sword keeps its parsing and formatting logic in small pure functions, so most of its tests are tables of input/expected pairs. This one is abridged from the real test, which has 12 cases:

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

Tables like this make rewrites safe. In 0.3.0, references gained ranges across chapters and lists of verses, and one new parser, `rcf-sword--reference-spans`, replaced the old one. The old parser's tests were rewritten against the new function with the same inputs, so the new parser had to give every old answer before it could add new ones.[^v030]

One trick in this file is worth stealing. It compares `(cons input actual)` against `(cons input expected)`, so a failure message names the input that broke:

```elisp
(pcase-dolist (`(,input ,message)
               '(("Jude" "Add a chapter number, like \"Jude 1\"")
                 ("John3:16" "Put a space before the chapter, like \"John 3:16\"")
                 ("Ps 23:5-2" "The verses in \"23:5-2\" run backwards; did you mean 23:2-5?")))
  (should (equal (cons input (rcf-sword--reference-problem input))
                 (cons input message))))
```

Without the `cons`, a failing loop only tells you that *some* message was wrong.

### Fixtures are just macros and `unwind-protect`

ERT deliberately has no set-up/tear-down framework. The manual explains why. Fixtures "are a useful syntactic simplification in other languages, [but] this does not apply to Lisp, where higher-order functions and `unwind-protect` are available," and it suggests writing a `with-my-fixture` macro instead.[^ert-fixtures]

That's exactly what rcf-sword does. Its database tests need a real SQLite file. A function builds a tiny one in a temporary file, and a macro binds it, runs the test body, then always closes and deletes it:

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

Notice that the fixture `let`-binds the package's own setting, `rcf-sword-bblx-file`, instead of setting it. The test then can't leak configuration into your editor.

In 0.2.2, the database-building code lived inside the macro. Version 0.3.0 added switching between translations, and testing that needs a *second* database. So the building moved into a plain function, and a test can now make as many fixtures as it needs:

```elisp
(let* ((other (rcf-sword-test--make-db
               "Plain Test Version" "PTV"
               '((19 23 1 " The Lord looks after me; I have all I need."))))
       (rcf-sword-bblx-files (list rcf-sword-bblx-file other)))
  (unwind-protect
      ...  ; compare Psalm 23:1 in both, then switch translations
    (delete-file other)))
```

That's the manual's point in practice: functions and macros compose, where a fixed set-up method wouldn't. The fixture's *data* is chosen with care too. Psalms has chapters 1, 2 and 23, so chapter navigation has to skip the missing numbers. One verse comes from book 67, which isn't in the default list of books, the way an apocryphal book appears in some modules.

Since Emacs 29, the `ert-x` library also has `ert-with-temp-file` (and `ert-with-temp-directory`). It creates the file, binds its name, and deletes it when the body exits, normally or not.[^ertx] I checked that this version of the fixture works the same, including the clean-up:

```elisp
(require 'ert-x)

(defmacro my-test--with-db (&rest body)
  (declare (indent 0) (debug t))
  `(ert-with-temp-file file
     :suffix ".bblx"
     ;; ... create the tables in FILE ...
     (let ((rcf-sword-bblx-file file))
       (unwind-protect (progn ,@body)
         (rcf-sword-close-database)))))
```

### Leave the environment as you found it

The manual's section on the test environment is the most important page to read. The core rule: "The outcome of running a test should not depend on the current state of the environment, and each test should leave its environment in the same state it found it in."[^ert-env] It recommends specific tools for this, and rcf-sword uses each of them:

| Problem | Manual's advice | In rcf-sword |
| :- | :- | :- |
| Code changes the current buffer | `with-temp-buffer` | All the insertion tests run in a temporary buffer |
| Code changes windows | `save-window-excursion` | The reader, search and translation tests |
| Behaviour depends on a setting | `let`-bind the variable | `(let ((rcf-sword-md-link-reference t)) ...)` |
| Anything else must be undone | `unwind-protect` | The database fixture; killing the reader buffer |

The manual also warns against calling heavily customisable commands like `find-file` in tests. Prefer `with-temp-buffer`, `insert`, and calling the major mode function directly.[^ert-env] That's why the org test does `(with-temp-buffer (org-mode) ...)` instead of opening a `.org` file.

### Stub the prompts, not the logic

Interactive commands ask questions, and a test can't type answers. rcf-sword's tests replace the prompt function for the length of one form, with `cl-letf` on its `symbol-function`. This stub doesn't even answer. It returns its own arguments, so the test can check what the prompt *would* show:

```elisp
(ert-deftest rcf-sword-test-read-reference ()
  "The prompt offers the reference at point and keeps a history."
  (with-temp-buffer
    (insert "Read Ps 23 today")
    (goto-char 8)
    (cl-letf (((symbol-function 'read-string)
               (lambda (prompt _initial history default)
                 (list prompt history default))))
      (should (equal (rcf-sword--read-reference "Enter verse")
                     '("Enter verse (default Ps 23): "
                       rcf-sword-reference-history "Ps 23"))))))
```

The same move answers a `completing-read` when switching translations. Stubbing `require` with `#'ignore` simulates an optional package that isn't installed, to check the reader's "Install the olivetti package for centered reading" message. Keep each stub's scope as small as possible: until the form exits, *every* caller in Emacs gets the stub. Stubbing works for ordinary functions, including ones written in C like `read-string`. It doesn't work for the few primitives the byte compiler turns into opcodes, such as `car` or `+`.

### Pass in the clock

`rcf-sword-verse-of-the-day` shows a verse that stays the same all day. The obvious test, "call it twice and compare", proves nothing about tomorrow, and mocking the system clock is fiddly. Instead, the function that picks the verse takes the time as an optional argument, and uses today when it's `nil`. The test simply passes in different moments:[^v030]

```elisp
(let* ((morning (encode-time '(0 0 8 30 10 2026 nil nil nil)))
       (evening (encode-time '(0 0 22 30 10 2026 nil nil nil)))
       (tomorrow (encode-time '(0 0 8 31 10 2026 nil nil nil)))
       (today (rcf-sword--verse-of-the-day morning)))
  (should (equal (rcf-sword--verse-of-the-day evening) today))
  (should-not (equal (rcf-sword--verse-of-the-day tomorrow) today)))
```

It also checks that a week of days gives seven different verses. Making time a parameter was a design decision taken for the tests' sake, and it's the general lesson: if a function depends on the clock, the random number generator or the environment, let a caller hand that dependency in.

### Test randomness with statistics

Random output can still be tested. You check its *distribution*, with bounds wide enough that chance never fails the build. Before 0.3.0, a random verse picked a book, then a chapter, then a verse, so a verse in a short book like Jude was about 100 times more likely than one in Psalms.[^v030] The fix lets SQLite pick one row from all of them, and this test pins it:

```elisp
(ert-deftest rcf-sword-test-random-is-fair ()
  "Random verses are drawn evenly from every verse."
  (rcf-sword-test--with-db
    (let ((counts (make-hash-table :test #'equal))
          (n (length rcf-sword-test--verses)))
      (dotimes (_ (* 100 n))
        (cl-incf (gethash (butlast (car (rcf-sword--random-verse)))
                          counts 0)))
      (should (= (hash-table-count counts) n))
      (maphash (lambda (_verse n) (should (< 50 n 160))) counts))))
```

The fixture has 10 verses, so there are 1,000 draws, and each verse should come up about 100 times, with a standard deviation of about 9.5. The test accepts anything strictly between 50 and 160, over five standard deviations either side. I worked out the exact binomial odds of a fair picker failing it anyway: less than one run in 11 million. The old picker failed it easily, because the fixture's only Proverbs verse came up about a third of the time. Wide bounds keep a statistical test from becoming a flaky one.

### Test through the keys people press

The reader is a special mode with one-key commands: `]` and `[` move between chapters, `y` copies a verse, `g` re-renders, and `q` quits. Rather than calling `rcf-sword-reader-next-chapter` directly, the tests look the key up and run whatever it's bound to:

```elisp
(call-interactively (keymap-lookup nil "]"))
(should (equal (seq-take (rcf-sword--verse-at-point) 2) (list 19 chapter)))
```

`keymap-lookup`, new in Emacs 29, searches the keymaps active in the current buffer when its first argument is `nil`.[^news29] So one line tests both the binding and the command, without the timing quirks of keyboard macros.

### Check that related pieces agree

Some bugs aren't in any one function. They're two pieces of the package drifting apart. rcf-sword has a prefix keymap and a transient menu offering the same commands on the same letters, so one test walks the keymap and checks each key against the menu:

```elisp
(map-keymap
 (lambda (key command)
   (should (commandp command))
   (unless (eq command #'rcf-sword-menu)
     (should (memq command (flatten-tree (transient-get-suffix
                                          'rcf-sword-menu (string key)))))))
 rcf-sword-command-map)
```

The same idea checks data: every entry in the customizable table of book abbreviations must resolve to a real book. Add a command to the map but not the menu, or an alias with a typo, and the build fails.

### Skip what can't run, rather than fail

rcf-sword works with `markdown-mode` and `olivetti`, but doesn't require them. The tests that use them say so up front:

```elisp
(ert-deftest rcf-sword-test-insert-markdown ()
  (skip-unless (require 'markdown-mode nil t))
  ...)
```

Run the suite in a bare `emacs -Q`, with no packages installed, and those tests are reported as skipped rather than failed. The run still succeeds:

```text
  skipped  10/53  rcf-sword-test-insert-markdown (0.000921 sec)
  ...
Ran 53 tests, 50 results as expected, 0 unexpected, 3 skipped (2026-10-30 22:46:47+0000, 1.236797 sec)

3 skipped results:
  SKIPPED  rcf-sword-test-insert-markdown
  SKIPPED  rcf-sword-test-markdown-footnotes
  SKIPPED  rcf-sword-test-reader-margins
```

Emacs 30 adds `skip-when`, the opposite of `skip-unless`. Stick to `skip-unless` if you support Emacs 29.[^ert-env]

### Test the contract, not just the code

Two of rcf-sword's tests check promises the package makes about itself, rather than any function. The first guards the Emacs convention that loading a package shouldn't *do* anything. In 0.2.2 it was one line, `(should-not rcf-sword--db)`. The 0.3.0 review noticed that a check like that, made inside the test session, can't really tell. By the time it runs, other tests have already loaded Org, markdown-mode and more, so it could never notice rcf-sword loading them. It now starts a fresh Emacs:[^v030]

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

`invocation-name` and `invocation-directory` name the Emacs that's running the tests, so in CI each version in the matrix checks itself. The child prints its findings with `prin1`, and the parent compares the text. The `'(t nil)` destination keeps the child's standard output and throws away its stderr, so warnings can't disturb the comparison.

The second test guards version 0.2.2's promise of no third-party dependencies:

```elisp
(ert-deftest rcf-sword-test-no-third-party-dependencies ()
  "rcf-sword needs nothing beyond Emacs: s.el is never loaded."
  (should-not (featurep 's)))
```

Version 0.2.2 replaced the `s.el` library with built-in functions, and the Makefile no longer installs `s`. So a stray `s-` call would fail the build here rather than on a user's machine.[^pr4] In 0.3.0 a CI job also [installs the package into a clean Emacs](#install-it-the-way-users-do), which checks the same promise from the outside.

### Test the error messages people will see

Interactive commands report problems with `user-error`. rcf-sword's errors are meant to be helpful ("Psalms ends at chapter 23, so there's no chapter 151"), so the tests check the exact wording. A small helper catches the error and returns its message:

```elisp
(defun rcf-sword-test--user-error (function &rest args)
  "Call FUNCTION with ARGS and return its `user-error' message, or nil."
  (condition-case err
      (progn (apply function args) nil)
    (user-error (error-message-string err))))
```

When you only care that *some* error of the right type is signalled, `should-error` is enough: `(should-error (rcf-sword--lookup "") :type 'user-error)`.

### Exact messages and the locale trap

Checking messages word for word has one trap, and rcf-sword fell into it. Four of its message tests passed on the maintainer's machine and failed in CI.[^v030]

`user-error`, like `message` and `error`, passes its format string through `format-message`. That function "replaces each grave accent (`` ` ``) by a left quote, and each apostrophe (`'`) by a right quote", in the style set by `text-quoting-style`. The default style uses curved quotes "if curved single quotes are displayable", so the result depends on the locale.[^quoting] CI ran in a UTF-8 locale, so `there's` became `there’s`. The local shell had no locale set, so it didn't. Here's a small demonstration, run in both locales:

```elisp
(defun demo-check (n)
  (when (> n 3) (user-error "There's no verse %d" n)))

(ert-deftest demo-exact-message ()
  (should (equal (condition-case err (demo-check 9)
                   (user-error (error-message-string err)))
                 "There's no verse 9")))
```

With `LANG=C` it passes. With `LANG=C.UTF-8` it fails, and ERT's explanation points straight at the culprit: character 5 is a right single quotation mark (`#x2019`) instead of an apostrophe (`#x27`):

```text
      :form
      (equal "There’s no verse 9" "There's no verse 9")
      :value nil :explanation
      (array-elt 5
		 (different-atoms
		  (8217 "#x2019" "?’")
		  (39 "#x27" "?'")))))
   FAILED  1/1  demo-exact-message (0.000171 sec)
```

rcf-sword's fix keeps apostrophes out of the format string. The text is built with plain `format`, which never curls quotes, and handed over as a `%s` argument:

```elisp
(user-error "%s" (format "%s ends at chapter %d, so there's no chapter %d"
                         name last-chapter chapter))
```

Backquoted symbol names like `` `rcf-sword-bblx-file' `` still go in the format string, where curling them is intended. The project's AGENTS.md now asks contributors to run `make` under a UTF-8 locale, so local runs match CI.

### Use tests to pin behaviour before a refactor

The most valuable tests in this file are the eight `rcf-sword-test-strings-*` tests. Before swapping `s.el` for built-ins, the maintainers ran a one-off script comparing the old and new versions over about 90 tricky inputs. All 17,383 comparisons matched. They then turned the interesting cases into permanent tests, so the behaviour is pinned down for good.[^readme] That's what *regression* testing means: once a behaviour is right, a test keeps it right.

## When a test fails

ERT's failure reports are its best feature. Here's a deliberately wrong test against rcf-sword:

```elisp
(ert-deftest demo-superscript-wrong ()
  "Expects the wrong superscript, to show how ERT reports a failure."
  (should (equal (rcf-sword--superscript 12) "¹³")))
```

ERT doesn't just say "not equal". It shows the form, the evaluated values, and an *explanation* of exactly where they differ: element 1 of the string, `²` (#xb2) against `³` (#xb3):

```text
Test demo-superscript-wrong condition:
    (ert-test-failed
     ((should
       (equal
	(rcf-sword--superscript 12)
	"¹³"))
      :form
      (equal "¹²" "¹³")
      :value nil :explanation
      (array-elt 1
		 (different-atoms
		  (178 "#xb2" "?²")
		  (179 "#xb3" "?³")))))
   FAILED  3/3  demo-superscript-wrong (0.000118 sec) at demo-test.el:5
```

Explanations work for `equal`, `eql` and friends inside `should`. They walk into lists, strings and vectors to find the first difference.[^ert-explain] The manual notes that it doesn't matter whether you write `(should (equal EXPECTED ACTUAL))` or `(should (equal ACTUAL EXPECTED))`. Pick one and be consistent.[^ert-techniques]

Two more tools help with known problems:

- **`:expected-result :failed`** marks a known bug. ERT counts the failure as expected, stays quiet about it, and alerts you if the test ever starts *passing*. That's your cue that the bug was fixed.[^ert-expected]
- **`:tags`** labels tests, for example `:tags '(:slow :needs-network)`, so you can select them by tag later.[^ert-selectors]

## Running tests

### Interactively, while you work

Load the package and its tests, for example with `M-x eval-buffer` in each file, then run `M-x ert` and press <kbd>RET</kbd> for the selector `t` (all tests). Chris Wellons recommended a key binding for this back in 2012, so you can "effortlessly run tests at any time."[^wellons] The `*ert*` buffer looks like this:

```text
Selector: t
Passed:  1
Failed:  2 (1 unexpected)
Skipped: 0
Total:   3/3

f.F

F demo-superscript-wrong
    Expects the wrong superscript, to show how ERT reports a failure.
    (ert-test-failed ...
```

The line `f.F` is the progress bar: one character per test. `.` means passed, `f` an expected failure, and `F` an unexpected failure. In that buffer:[^ert-interactive]

| Key | Does |
| :- | :- |
| <kbd>RET</kbd> / <kbd>.</kbd> | Jump to the test's definition |
| <kbd>r</kbd> | Re-run the test at point |
| <kbd>d</kbd> | Re-run it with the debugger on errors |
| <kbd>R</kbd> | Re-run all tests |
| <kbd>b</kbd> | Show the backtrace |
| <kbd>l</kbd> | Show every `should` form the test evaluated |
| <kbd>m</kbd> | Show the messages the test printed |
| <kbd>h</kbd> | Describe the test |
| <kbd>D</kbd> | Delete the test from Emacs |

One trap: ERT runs whatever tests are *currently defined in Emacs*. If you rename a test, the old one stays defined until you delete it with <kbd>D</kbd> or restart Emacs. That's one reason batch runs, which start a fresh Emacs every time, are the source of truth.

### In batch mode, from the shell

This is the form the manual documents, and every CI setup builds on it:[^ert-batch]

```sh
emacs -batch -l ert -l my-tests.el -f ert-run-tests-batch-and-exit
```

It "will exit with a zero exit status if all tests passed, or nonzero if any tests failed or if anything else went wrong." A shell, a Makefile or a CI runner needs nothing else. rcf-sword's `make test` expands to this:

```sh
emacs -Q --batch -L . -L test -l rcf-sword-test -f ert-run-tests-batch-and-exit
```

- `-Q` skips your init files and the site-wide startup files, so the tests see a clean Emacs. If a test only passes with your config loaded, it's testing your config.
- `-L .` and `-L test` add the package and test directories to `load-path`, so `(require 'rcf-sword)` finds the source.
- `-l rcf-sword-test` loads the tests, and `-f ert-run-tests-batch-and-exit` runs them and sets the exit status.

The real run prints one line per test, then a summary:

```text
Running 53 tests (2026-10-30 22:46:35+0000, selector ‘t’)
   passed   1/53  rcf-sword-test-book-aliases (0.000659 sec)
   ...
   passed  53/53  rcf-sword-test-verse-of-the-day (0.017385 sec)

Ran 53 tests, 53 results as expected, 0 unexpected (2026-10-30 22:46:38+0000, 2.929419 sec)
```

The quotes around the selector are curly because this ran in a UTF-8 locale. That's the [locale trap](#exact-messages-and-the-locale-trap) again, this time harmlessly.

### Choosing which tests run

Pass a *selector* to `ert-run-tests-batch-and-exit` to run a subset. A string is a regular expression matched against test names:[^ert-selectors]

```sh
emacs -Q --batch -L . -L test -l rcf-sword-test \
  --eval '(ert-run-tests-batch-and-exit "strings")'
# Running 8 tests (... selector ‘"strings"’)
```

Selectors combine like a small query language:
- `t` and `nil` select everything and nothing.
- `(tag :fast)` selects by tag.
- `(not ...)`, `(and ...)` and `(or ...)` combine selectors.
- `:failed`, `:unexpected` and `:new` select by last result, which is mostly useful interactively.

For example, `'(and "reader" (not "margins"))` runs the four reader tests that don't need olivetti, and `'(not (tag :slow))` would skip tests tagged as slow.

### Controlling the output

| Want | Use |
| :- | :- |
| Only failures and the summary | `--eval '(let ((ert-quiet t)) (ert-run-tests-batch-and-exit))'` |
| Failure data in the final summary too | Set the `EMACS_TEST_VERBOSE=1` environment variable |
| Bigger printed values in failures | Bind `ert-batch-print-level` and `ert-batch-print-length` |
| Full-length backtrace lines | Bind `ert-batch-backtrace-line-length` |
| A JUnit XML report | Set the `EMACS_TEST_JUNIT_REPORT` environment variable (Emacs 29+) |

All of these are documented in the manual's batch-mode section.[^ert-batch]

The JUnit report needs a little explanation, because it's what CI systems understand. It was added in Emacs 29 "for Emacs integration into CI/CD test environments."[^news29] Set the variable to any non-empty value. ERT then writes one report per test file, named after that file and placed next to it.[^ert-junit] For rcf-sword that's `test/rcf-sword-test.xml`:

```xml
<testsuites name="rcf-sword-test.xml" tests="53" errors="0" failures="0" skipped="0" time="1.527763263">
  <testsuite id="0" name="rcf-sword-test.xml" tests="53" ... skipped="0" ...>
    <testcase name="rcf-sword-test-book-aliases" status="passed" time="0.001029923"/>
    <testcase name="rcf-sword-test-book-numbers-are-sequential" status="passed" time="2.6068e-05"/>
    ...
```

The variable's *value* only matters for `ert-write-junit-test-summary-report`, which merges several reports into one file of that name.

### Tools that wrap ERT

A Makefile, like rcf-sword's, is the smallest dependable runner. Plenty of people have built more:

| Tool | Author | What it gives you |
| :- | :- | :- |
| A Makefile | You | Full control, and nothing to install. rcf-sword installs its development dependencies into a private `./.elpa` directory so your own packages aren't touched. |
| [Cask](https://github.com/cask/cask) | Johan Andersson, with Sebastian Wiesner and Takafumi Arakaki[^cask-src] | Dependency management for development. It now recommends plain `cask emacs --batch ... -f ert-run-tests-batch`, and says "We have deprecated the `cask exec` invocation, and consequently no longer recommend `cask exec ert-runner` nor `cask exec ecukes`."[^cask] |
| [ert-runner](https://github.com/rejeep/ert-runner.el) | Johan Andersson, Sebastian Wiesner, Jorgen Schäfer | Finds `test/*-test.el` files and runs them. Older, and tied to Cask's `exec`.[^ert-runner] |
| [Eldev](https://github.com/emacs-eldev/eldev) | Paul Pogonyshev[^eldev] | An Emacs-based build tool and Cask alternative. It supports ERT, Buttercup, Doctest and Ecukes, and `eldev test` runs them all.[^eldev-doc] |
| [Eask](https://github.com/emacs-eask/cli) | Jen-Chieh Shen[^eask] | A Node-distributed CLI with `eask test ert [files..]`, `eask compile` and more, plus a ready-made GitHub Actions setup.[^eask-gha] |
| [makem.sh](https://github.com/alphapapa/makem.sh) | Adam Porter (alphapapa) | A single script that "helps to build, lint, and test Emacs Lisp packages" with no per-package configuration. It can run in a throwaway "sandbox" Emacs.[^makem] |

Two neighbours are worth knowing about:

- **[Buttercup](https://github.com/jorgenschaefer/emacs-buttercup)**, by Jorgen Schäfer and now maintained by Ola Nilsson, is a "behavior-driven development framework" modelled on JavaScript's Jasmine, with `describe` and `it` blocks.[^buttercup] The [awesome-elisp](https://github.com/emacs-tw/awesome-elisp) list suggests ERT for unit tests and Buttercup for integration tests that need shared set-up.[^awesome]
- **[undercover.el](https://github.com/undercover-el/undercover.el)**, by Sviridov Alexander and Vladimir Panteleev, adds test coverage. It's based on `edebug`, so it can't measure byte-compiled files.[^undercover] Sacha Chua's write-up shows a complete set-up with Buttercup, a `make test-coverage` target and `UNDERCOVER_FORCE=true`, and the result shown in your buffers.[^chua]

## Putting it in CI

### What a good pipeline does

These principles hold on any CI system:

1. **Run in batch with `-Q`**, so every run starts from a clean Emacs.
2. **Install development dependencies into a private directory**, never your own `~/.emacs.d`. rcf-sword sets `package-user-dir` to `./.elpa`.
3. **Byte-compile with warnings as errors** (`byte-compile-error-on-warn`), and run `checkdoc` and `package-lint` alongside the tests. Many Emacs Lisp bugs, like free variables, typos in function names or wrong argument counts, surface as compiler warnings long before a test hits them.
4. **Test a matrix of Emacs versions:** your declared minimum, the latest release of each version since, and the development snapshot. Turn `fail-fast` off so one failure doesn't hide the others.
5. **Rely on the exit status.** `ert-run-tests-batch-and-exit` already returns non-zero on failure. Don't parse its output.
6. **Install the package the way users do**, into an Emacs with no configuration, and check that it installs cleanly and autoloads its commands.
7. **Pin third-party actions to commit SHAs**, and let a bot propose updates.
8. **Check release tags** against the version the package declares.
9. **Match CI's locale locally**, or set it explicitly, so message tests behave the same everywhere.
10. **Publish a JUnit report** so failures show up in the CI interface, not just in logs.

rcf-sword's CI now does all of these except the last.

### GitHub Actions

Steve Purcell's [setup-emacs](https://github.com/purcell/setup-emacs) action installs any Emacs version from 23.4 onwards on Linux. It's built on his [nix-emacs-ci](https://github.com/purcell/nix-emacs-ci) project, and its own README counts more than 1,500 repositories using it.[^setup-emacs][^nix-emacs-ci] It doesn't support Windows, because it relies on Nix. Jen-Chieh Shen's [setup-emacs](https://github.com/jcs090218/setup-emacs) covers Windows too.[^setup-emacs-jcs]

In 0.2.2, rcf-sword's whole workflow was 20 lines and one job. In 0.3.0 it has three jobs:[^v030]

```yaml
name: CI

# Actions are pinned to commit SHAs (with the release in a comment), so a
# moved tag or branch can't change what runs here.  Dependabot proposes
# updates; see .github/dependabot.yml.

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
    # On a release tag, check it names the version in the file's header, so
    # a tag can't mark the wrong commit (v0.2.1 once marked a 0.2.0 commit).
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
    # Install the package the way the README's quick start does, in an Emacs
    # with no config and only the default package archives, so a dependency
    # that isn't built in (like the old s.el) fails here, not for users.
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

The `test` job still runs `make all`, so CI and your laptop run the same commands. The Makefile now covers two files, the package and its optional Org links in `rcf-sword-org.el`, and tells `package-lint` which one is the main file.

#### A matrix that earns its keep

The matrix is the oldest supported version (29.1, the version in `Package-Requires`), the latest release of each version since (29.4, 30.2 and 31.1), and the development snapshot. That checks the promise made to users, catches use of anything newer, and gives early warning of changes on the way.

It paid off straight away. Emacs 31.1 made `if-let` and `when-let` obsolete: "Use 'if-let*', 'when-let*' and 'and-let*' instead."[^news31] Using an obsolete macro is a byte-compiler warning, and CI treats warnings as errors, so the 31.1 and snapshot jobs failed to compile while 29 and 30 stayed green. The fix was mechanical: `if-let*` and `when-let*` exist since Emacs 26 and behave the same for single bindings. Without 31.1 in the matrix, the first sign would have been a user's warning.[^v030]

#### Pin your actions

`actions/checkout@v4` and `purcell/setup-emacs@master` name a tag and a branch, and either can change under you. GitHub's security guide recommends pinning third-party actions to a full-length commit SHA, warning that "a tag can be moved or deleted if a bad actor gains access to the repository storing the action."[^gh-pin] rcf-sword now pins both actions, with the release in a comment so a human can still read it. Pinning would freeze the actions forever, so a small `.github/dependabot.yml` asks Dependabot to propose updates once a month:[^dependabot]

```yaml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: monthly
```

#### Check the release tag

Emacs packages announce their version in a `;; Version:` header, and git tags mark releases. They can disagree. rcf-sword's `v0.2.1` tag marks commit `c0a5dfe`, whose header still says 0.2.0. The new `release-tag` job runs only on `v*` tags, and fails unless the tag is `v` plus the header's version. It was tested locally against both cases: `v0.2.2` passes and `v0.2.1` fails.[^v030]

#### Install it the way users do

The test job loads the source with `-L .`, which is not how anyone installs the package. The `vanilla-install` job does what the README's quick start tells users to do. It installs the checkout with `package-vc`, in an Emacs with a brand-new `HOME`, so there's no configuration and only the default package archives. Then it makes two checks:

1. **The install is silent.** Any line with "warning", "error" or "failed" fails the job. When the old `s.el` dependency was put back as an experiment, it failed with "Failed to install the following dependencies: s".[^v030]
2. **The commands are autoloaded.** A second, fresh Emacs runs `package-activate-all`, as startup does, and checks that `rcf-sword-insert-verse` is an autoload and that rcf-sword itself *isn't* loaded yet.

I ran the job's script locally against 0.3.0, and it passed. Its log also shows `no-byte-compile` [from the test file's header](#the-file-header) doing its job: `package-vc` visits the test file but doesn't compile it:

```text
Compiling .../elpa/rcf-sword/rcf-sword-org.el...
Compiling .../elpa/rcf-sword/rcf-sword.el...
Compiling .../elpa/rcf-sword/test/rcf-sword-test.el...
Done (Total of 2 files compiled, 3 skipped in 2 directories)
VC package `rcf-sword' installed (Version 0.3.0, Revision "414dd03...").
```

#### One addition: a JUnit report

The one principle rcf-sword's CI doesn't follow yet is the JUnit report. Set the variable and upload the report, even when tests fail:

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

If you use Eask, its docs give a ready-made matrix across Ubuntu, macOS and Windows and Emacs versions from 26.3 to the snapshot. It uses `jcs090218/setup-emacs` and `emacs-eask/setup-eask`.[^eask-gha]

### GitLab CI

Silex's [docker-emacs](https://github.com/Silex/docker-emacs) project publishes Docker images that wrap nix-emacs-ci. The `-ci` tags add `git` and `make`, and there are `-ci-cask`, `-ci-eask` and `-ci-eldev` variants with those tools included.[^docker-emacs] GitLab reads JUnit files natively through `artifacts:reports:junit`. Use `when: always` so failed runs still upload. The report itself doesn't fail the job; the script's exit status does.[^gitlab] Put together:

```yaml
test:
  image: silex/emacs:${EMACS_VERSION}-ci
  parallel:
    matrix:
      - EMACS_VERSION: ["29.4", "30.2"]
  variables:
    EMACS_TEST_JUNIT_REPORT: "1"
    LANG: C.UTF-8  # the same locale as your laptop, for message tests
  script:
    - make all
  artifacts:
    when: always
    reports:
      junit: test/*.xml
```

GitLab then shows passed and failed tests in the merge request and on the pipeline's Tests tab, and points out tests that newly failed compared with the target branch.[^gitlab]

## The best way, in short

For a package like rcf-sword, this is the setup I'd recommend, and it's what rcf-sword already does, with one addition:

1. **ERT for the tests.** It's built in, it explains failures well, and its batch mode is exactly what CI needs. Add Buttercup only if you really want `describe`/`it` suites.
2. **A Makefile for running them.** It takes four targets (`compile`, `checkdoc`, `lint`, `test`), installs nothing globally, and runs the same commands on your laptop as in CI. Reach for Eldev or Eask when you have several dependencies to manage, or want their extra commands.
3. **GitHub Actions with `purcell/setup-emacs`**, a version matrix from your minimum supported Emacs through the latest release of each version to the snapshot, and `fail-fast: false`.
4. **Two small jobs beside the tests:** install the package into a vanilla Emacs as users do, and check release tags against the `Version:` header.
5. **Actions pinned to commit SHAs**, with Dependabot proposing updates.
6. **One addition:** `EMACS_TEST_JUNIT_REPORT` plus an `upload-artifact` step, so failures are readable without digging through logs.

## Checklist for every test file

- [ ] `lexical-binding: t`, and `no-byte-compile: t` if the repository is installed with `package-vc`.
- [ ] Ends with `(provide 'name-test)`, and every test name starts with the package prefix.
- [ ] Every test has a docstring, and tests are grouped by feature.
- [ ] Keep logic in small pure functions so most tests are simple input/output tables.
- [ ] `let`-bind settings; never `setq` them.
- [ ] Use `with-temp-buffer`, `save-window-excursion` and `unwind-protect` for anything the code changes.
- [ ] Build fixtures with functions and macros, or `ert-with-temp-file`, and always delete what they create.
- [ ] Stub prompts with `cl-letf` around as small a form as possible.
- [ ] Pass the clock, randomness and other outside state in as arguments where you can.
- [ ] Test random behaviour by its distribution, with bounds wide enough never to flake.
- [ ] Drive commands through their key bindings, and check that maps, menus and tables agree.
- [ ] `skip-unless` for optional dependencies and platform features.
- [ ] Test the package's promises in a fresh Emacs: nothing happens at load time, and no surprise dependencies.
- [ ] Check user-facing error messages word for word, and keep apostrophes out of `user-error` format strings.
- [ ] Mark known bugs with `:expected-result :failed` instead of deleting the test.
- [ ] Run the suite in `emacs -Q --batch`, under a UTF-8 locale, before every push.

## References

[^ert-src]: GNU Emacs source, [`lisp/emacs-lisp/ert.el`](https://github.com/emacs-mirror/emacs/blob/emacs-29/lisp/emacs-lisp/ert.el) (file header: "Author: Christian Ohler").
[^wellons]: C. Wellons, "Elisp Unit Testing with ERT," *null program*, 15 August 2012. <https://nullprogram.com/blog/2012/08/15/>
[^mccracken]: J. McCracken, "Fast Emacs Lisp Regression Test Framework Tutorial," 9 June 2012. <http://joelmccracken.github.io/entries/basics-of-ert/>
[^ert-intro]: *ERT: Emacs Lisp Regression Testing* (GNU manual), "Introduction." <https://www.gnu.org/software/emacs/manual/html_node/ert/Introduction.html>
[^ert-techniques]: ERT manual, "Useful Techniques when Writing Tests." <https://www.gnu.org/software/emacs/manual/html_node/ert/Useful-Techniques.html>
[^ert-fixtures]: ERT manual, "Fixtures and Test Suites." <https://www.gnu.org/software/emacs/manual/html_node/ert/Fixtures-and-Test-Suites.html>
[^ert-env]: ERT manual, "Tests and Their Environment." <https://www.gnu.org/software/emacs/manual/html_node/ert/Tests-and-Their-Environment.html>
[^ert-explain]: ERT manual, "Understanding Explanations." <https://www.gnu.org/software/emacs/manual/html_node/ert/Understanding-Explanations.html>
[^ert-expected]: ERT manual, "Expected Failures." <https://www.gnu.org/software/emacs/manual/html_node/ert/Expected-Failures.html>
[^ert-selectors]: ERT manual, "Test Selectors." <https://www.gnu.org/software/emacs/manual/html_node/ert/Test-Selectors.html>
[^ert-interactive]: ERT manual, "Running Tests Interactively." <https://www.gnu.org/software/emacs/manual/html_node/ert/Running-Tests-Interactively.html>
[^ert-batch]: ERT manual, "Running Tests in Batch Mode." <https://www.gnu.org/software/emacs/manual/html_node/ert/Running-Tests-in-Batch-Mode.html>
[^ertx]: GNU Emacs source, [`lisp/emacs-lisp/ert-x.el`](https://github.com/emacs-mirror/emacs/blob/emacs-29/lisp/emacs-lisp/ert-x.el): `ert-with-temp-file` and `ert-with-temp-directory` are present on the emacs-29 branch and absent on emacs-28.
[^news29]: GNU Emacs 29 NEWS, "ERT can generate JUnit test reports." <https://github.com/emacs-mirror/emacs/blob/emacs-29/etc/NEWS>
[^ert-junit]: GNU Emacs source, `ert-write-junit-test-report` and `ert-write-junit-test-summary-report` in [`ert.el`](https://github.com/emacs-mirror/emacs/blob/emacs-29/lisp/emacs-lisp/ert.el).
[^pr4]: RyansGhost/rcf-sword, "rcf-sword 0.2.2: no dependencies, quick start, friendly errors" (#4). <https://github.com/RyansGhost/rcf-sword/commit/14564544497eb4b0997094de536c5580e32d09c3>
[^readme]: RyansGhost/rcf-sword README, "Interesting notes." <https://github.com/RyansGhost/rcf-sword#interesting-notes>
[^v030]: RyansGhost/rcf-sword, "rcf-sword 0.3.0: reader navigation, search, translations, Org links and more" (#5), including the commit notes "Review the tests", "Fix CI: keep apostrophes in messages straight in UTF-8 locales", "Fix CI on Emacs 31: use if-let* and when-let*" and the three CI commits. <https://github.com/RyansGhost/rcf-sword/commit/3b42ff236bc7ca538be78789d044e635460f168c>
[^quoting]: GNU Emacs 29 docstrings of `format-message` and `text-quoting-style` (`C-h f format-message`, `C-h v text-quoting-style`). The Elisp manual covers the same ground in "Text Quoting Style." <https://www.gnu.org/software/emacs/manual/html_node/elisp/Text-Quoting-Style.html>
[^news31]: GNU Emacs 31 NEWS, "'if-let' and 'when-let' are now obsolete." <https://github.com/emacs-mirror/emacs/blob/emacs-31/etc/NEWS>
[^gh-pin]: GitHub Docs, "Security hardening for GitHub Actions: Using third-party actions." <https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions#using-third-party-actions>
[^dependabot]: GitHub Docs, "Keeping your actions up to date with Dependabot." <https://docs.github.com/en/code-security/dependabot/working-with-dependabot/keeping-your-actions-up-to-date-with-dependabot>
[^cask-src]: Cask source, [`cask.el`](https://github.com/cask/cask/blob/master/cask.el) (copyright: Johan Andersson; Sebastian Wiesner; Takafumi Arakaki).
[^cask]: Cask README. <https://github.com/cask/cask>
[^ert-runner]: J. Andersson et al., ert-runner.el README. <https://github.com/rejeep/ert-runner.el>
[^eldev]: P. Pogonyshev, Eldev (`eldev.el` header). <https://github.com/emacs-eldev/eldev>
[^eldev-doc]: Eldev documentation, "Testing." <https://emacs-eldev.github.io/eldev/>
[^eask]: J. Shen, Eask CLI (`package.json` author; `eask test ert` command). <https://github.com/emacs-eask/cli>
[^eask-gha]: Eask documentation, "GitHub Actions." <https://emacs-eask.github.io/Continuous-Integration/GitHub-Actions/>
[^makem]: A. Porter, makem.sh README. <https://github.com/alphapapa/makem.sh>
[^buttercup]: J. Schäfer and O. Nilsson, Buttercup README and `buttercup.el` header. <https://github.com/jorgenschaefer/emacs-buttercup>
[^awesome]: emacs-tw, awesome-elisp, "Testing." <https://github.com/emacs-tw/awesome-elisp>
[^undercover]: S. Alexander and V. Panteleev, undercover.el README. <https://github.com/undercover-el/undercover.el>
[^chua]: S. Chua, "Coverage reporting in Emacs with Buttercup, Undercover, Coverage, and a Makefile," 2 January 2022. <https://sachachua.com/blog/2022/01/coverage-reporting-in-emacs-with-buttercup-undercover-coverage-and-a-makefile/>
[^setup-emacs]: S. Purcell, setup-emacs README. <https://github.com/purcell/setup-emacs>
[^nix-emacs-ci]: S. Purcell, nix-emacs-ci README ("Official release versions from 23.4 are supported on Linux"). <https://github.com/purcell/nix-emacs-ci>
[^setup-emacs-jcs]: J. Shen, setup-emacs README. <https://github.com/jcs090218/setup-emacs>
[^docker-emacs]: Silex, docker-emacs README. <https://github.com/Silex/docker-emacs>
[^gitlab]: GitLab Docs, "Unit test reports." <https://docs.gitlab.com/ci/testing/unit_test_reports/>
