---
date: 2026-10-30T15:27:27Z
draft: false
title: "Testing Emacs Lisp with ERT: A Field Manual"
description: "How to write, run and automate ERT tests for Emacs Lisp, using the 28-test suite of rcf-sword as a worked example, with every command run and every claim cited."
categories:
  - technology
tags:
  - "claude-code"
  - emacs
  - elisp
  - testing
  - ci
---

This is a manual for testing Emacs Lisp with ERT, the test framework built into Emacs. It uses one real test suite as its running example: the 28 tests in [RyansGhost/rcf-sword](https://github.com/RyansGhost/rcf-sword) at version 0.2.2 (commit [`1456454`](https://github.com/RyansGhost/rcf-sword/commit/14564544497eb4b0997094de536c5580e32d09c3)).

It covers three things:

1. how to write tests that hold up;
2. every practical way to run them;
3. how to wire them into CI so every push is checked.

Every command and every piece of output below was run for real on GNU Emacs 29.3 while writing this. Claims about tools come from their own manuals and source code, and are footnoted.

## ERT in one minute

ERT stands for *Emacs Lisp Regression Testing*. Christian Ohler wrote it, and it has shipped with Emacs since Emacs 24.[^ert-src][^wellons] As Joel McCracken put it in 2012, "it is now in Emacs proper, so it is basically the standard way to write tests now."[^mccracken]

The manual describes the idea plainly: "Tests are simply Lisp code: code that invokes other code and checks whether it behaves as expected."[^ert-intro] A test is defined with `ert-deftest`, and makes its checks with three macros:

- `should` fails the test unless its form returns non-nil;
- `should-not` fails the test if its form returns non-nil;
- `should-error` fails the test unless its form signals an error, optionally of a specific `:type`.

Here's one of rcf-sword's tests:

```elisp
(ert-deftest rcf-sword-test-superscript ()
  (should (equal (rcf-sword--superscript 0) "⁰"))
  (should (equal (rcf-sword--superscript 123) "¹²³"))
  (should (equal (rcf-sword--superscript 4567890) "⁴⁵⁶⁷⁸⁹⁰")))
```

That's the whole framework. Everything else is technique, and tools for running it.

## Anatomy of a real test file

rcf-sword reads scripture out of a SQLite file. Its tests in [`test/rcf-sword-test.el`](https://github.com/RyansGhost/rcf-sword/blob/master/test/rcf-sword-test.el) run to 348 lines. Each habit below is worth copying.

### The file header

```elisp
;;; rcf-sword-test.el --- Tests for rcf-sword  -*- lexical-binding: t; no-byte-compile: t; -*-
```

`lexical-binding: t` matches the package itself. `no-byte-compile: t` is a lesson the project learned the hard way. `package-vc` byte-compiles every file in a repository when it installs it, so the first users saw warnings from the *test* file, which isn't part of the package. Marking it `no-byte-compile` fixed that, and `make test` loads the source directly instead.[^pr4]

The file then requires `ert` and the package under test, and ends with `(provide 'rcf-sword-test)`, so `-l rcf-sword-test` can load it by name.

### Pure functions get plain, table-like tests

The easiest code to test takes input and returns output, with no side effects. The ERT manual says the same.[^ert-techniques] rcf-sword keeps its parsing and formatting logic in small pure functions, so most of its tests are lists of input/expected pairs:

```elisp
(ert-deftest rcf-sword-test-parse-reference ()
  (should (equal (rcf-sword--parse-reference "Genesis 6") '("Genesis" 6 nil)))
  (should (equal (rcf-sword--parse-reference "Genesis 6:1-2") '("Genesis" 6 (1 2))))
  (should (equal (rcf-sword--parse-reference "  1 Cor 13:4-7 ") '("1 Cor" 13 (4 7))))
  (should (equal (rcf-sword--parse-reference "Jude") '("" 0 nil))))
```

When a table gets long, loop over it. One trick in this file is worth stealing. It compares `(cons input actual)` against `(cons input expected)`, so a failure message names the input that broke:

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

That's exactly what rcf-sword does. Its database tests need a real SQLite file, so a macro builds a tiny one in a temporary file, runs the test body, then always closes and deletes it:

```elisp
(defmacro rcf-sword-test--with-db (&rest body)
  "Run BODY with `rcf-sword-bblx-file' bound to a fixture database."
  (declare (indent 0) (debug t))
  `(let* ((file (make-temp-file "rcf-sword-test" nil ".bblx"))
          (rcf-sword-bblx-file file))
     (unwind-protect
         (progn
           ;; ... CREATE TABLE and INSERT a handful of public-domain verses ...
           (rcf-sword-close-database)
           ,@body)
       (rcf-sword-close-database)
       (delete-file file))))
```

Notice that the fixture `let`-binds the package's own setting, `rcf-sword-bblx-file`, instead of setting it. The test then can't leak configuration into your editor.

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
| Code changes windows | `save-window-excursion` | The book-reader test |
| Behaviour depends on a setting | `let`-bind the variable | `(let ((rcf-sword-md-link-reference t)) ...)` |
| Anything else must be undone | `unwind-protect` | The database fixture; killing the reader buffer |

The manual also warns against calling heavily customisable commands like `find-file` in tests. Prefer `with-temp-buffer`, `insert`, and calling the major mode function directly.[^ert-env] That's why the org test does `(with-temp-buffer (org-mode) ...)` instead of opening a `.org` file.

### Skip what can't run, rather than fail

rcf-sword works with `markdown-mode` but doesn't require it. The Markdown test says so up front:

```elisp
(ert-deftest rcf-sword-test-insert-markdown ()
  (skip-unless (require 'markdown-mode nil t))
  ...)
```

Run the suite in a bare `emacs -Q`, with no packages installed, and that test is reported as skipped rather than failed. The run still succeeds:

```text
  skipped   5/28  rcf-sword-test-insert-markdown (0.001181 sec)
Ran 28 tests, 27 results as expected, 0 unexpected, 1 skipped
```

Emacs 30 adds `skip-when`, the opposite of `skip-unless`. Stick to `skip-unless` if you support Emacs 29.[^ert-env]

### Test the contract, not just the code

Two of rcf-sword's tests check promises the package makes about itself, rather than any function:

```elisp
(ert-deftest rcf-sword-test-loading-has-no-side-effects ()
  (should-not rcf-sword--db))

(ert-deftest rcf-sword-test-no-third-party-dependencies ()
  (should-not (featurep 's)))
```

The first guards the Emacs convention that loading a package shouldn't *do* anything; here, it mustn't open the database. The second guards version 0.2.2's promise of no third-party dependencies. Version 0.2.2 replaced the `s.el` library with built-in functions, and the Makefile no longer installs `s`. So a stray `s-` call would fail the build here rather than on a user's machine.[^pr4]

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
Running 28 tests (2026-10-30 15:23:32+0000, selector `t')
   passed   1/28  rcf-sword-test-book-numbers-are-sequential (0.000214 sec)
   ...
   passed  28/28  rcf-sword-test-superscript (0.000082 sec)

Ran 28 tests, 28 results as expected, 0 unexpected (2026-10-30 15:23:34+0000, 1.820571 sec)
```

### Choosing which tests run

Pass a *selector* to `ert-run-tests-batch-and-exit` to run a subset. A string is a regular expression matched against test names:[^ert-selectors]

```sh
emacs -Q --batch -L . -L test -l rcf-sword-test \
  --eval '(ert-run-tests-batch-and-exit "strings")'
# Running 8 tests (... selector `"strings"')
```

Selectors combine like a small query language:
- `t` and `nil` select everything and nothing.
- `(tag :fast)` selects by tag.
- `(not ...)`, `(and ...)` and `(or ...)` combine selectors.
- `:failed`, `:unexpected` and `:new` select by last result, which is mostly useful interactively.

For example, `'(and "^rcf-sword-" (not (tag :slow)))` runs everything but the slow tests.

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
<testsuites name="rcf-sword-test.xml" tests="28" errors="0" failures="0" skipped="1" time="0.638533242">
  <testsuite id="0" name="rcf-sword-test.xml" tests="28" ... skipped="1" ...>
    <testcase name="rcf-sword-test-book-numbers-are-sequential" status="passed" time="0.000116751"/>
    ...
    <testcase name="rcf-sword-test-insert-markdown" status="skipped" time="0.001190788">
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
4. **Test a matrix of Emacs versions:** your declared minimum, the current release and the development snapshot. Turn `fail-fast` off so one failure doesn't hide the others.
5. **Rely on the exit status.** `ert-run-tests-batch-and-exit` already returns non-zero on failure. Don't parse its output.
6. **Publish a JUnit report** so failures show up in the CI interface, not just in logs.

### GitHub Actions

Steve Purcell's [setup-emacs](https://github.com/purcell/setup-emacs) action installs any Emacs version from 23.4 onwards on Linux. It's built on his [nix-emacs-ci](https://github.com/purcell/nix-emacs-ci) project, and its own README counts more than 1,500 repositories using it.[^setup-emacs][^nix-emacs-ci] It doesn't support Windows, because it relies on Nix. Jen-Chieh Shen's [setup-emacs](https://github.com/jcs090218/setup-emacs) covers Windows too.[^setup-emacs-jcs]

rcf-sword's whole workflow is 20 lines:

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
        emacs_version: ["29.1", "29.4", "30.1", "snapshot"]
    steps:
      - uses: actions/checkout@v4
      - uses: purcell/setup-emacs@master
        with:
          version: ${{ matrix.emacs_version }}
      - name: Byte-compile, checkdoc, package-lint and ERT
        run: make all
```

It starts the matrix at 29.1, the version declared in `Package-Requires`. That checks the promise the package makes to users, and catches use of anything newer.

Two additions would make it better. First, set the JUnit variable and upload the report even when tests fail:

```yaml
      - name: Byte-compile, checkdoc, package-lint and ERT
        run: make all
        env:
          EMACS_TEST_JUNIT_REPORT: "1"
      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: ert-report-${{ matrix.emacs_version }}
          path: test/*.xml
```

Second, if you use Eask, its docs give a ready-made matrix across Ubuntu, macOS and Windows and Emacs versions from 26.3 to the snapshot. It uses `jcs090218/setup-emacs` and `emacs-eask/setup-eask`.[^eask-gha]

### GitLab CI

Silex's [docker-emacs](https://github.com/Silex/docker-emacs) project publishes Docker images that wrap nix-emacs-ci. The `-ci` tags add `git` and `make`, and there are `-ci-cask`, `-ci-eask` and `-ci-eldev` variants with those tools included.[^docker-emacs] GitLab reads JUnit files natively through `artifacts:reports:junit`. Use `when: always` so failed runs still upload. The report itself doesn't fail the job; the script's exit status does.[^gitlab] Put together:

```yaml
test:
  image: silex/emacs:${EMACS_VERSION}-ci
  parallel:
    matrix:
      - EMACS_VERSION: ["29.4", "30.1"]
  variables:
    EMACS_TEST_JUNIT_REPORT: "1"
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
3. **GitHub Actions with `purcell/setup-emacs`**, a version matrix from your minimum supported Emacs to the snapshot, and `fail-fast: false`.
4. **One addition:** `EMACS_TEST_JUNIT_REPORT` plus an `upload-artifact` step, so failures are readable without digging through logs.

## Checklist for every test file

- [ ] `lexical-binding: t`, and `no-byte-compile: t` if the repository is installed with `package-vc`.
- [ ] Ends with `(provide 'name-test)`, and every test name starts with the package prefix.
- [ ] Keep logic in small pure functions so most tests are simple input/output tables.
- [ ] `let`-bind settings; never `setq` them.
- [ ] Use `with-temp-buffer`, `save-window-excursion` and `unwind-protect` for anything the code changes.
- [ ] Create temporary files with a fixture macro, or `ert-with-temp-file`, and always delete them.
- [ ] `skip-unless` for optional dependencies and platform features.
- [ ] Test the package's promises: nothing happens at load time, and no surprise dependencies.
- [ ] Check user-facing error messages word for word.
- [ ] Mark known bugs with `:expected-result :failed` instead of deleting the test.
- [ ] Run the suite in `emacs -Q --batch` before every push.

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
