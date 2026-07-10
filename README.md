# VS Code Snippet Generator

Turn selected text into a VS Code snippet — either as a JSON block to paste
somewhere yourself, or saved straight into your user snippets for a language
of your choice.

## Features

### Snippet: Generate snippet JSON block

Select text, run the command, answer the name/prefix/description prompts, and
the selection is replaced with the snippet JSON block, ready to paste into any
snippets file.

![Generate snippet from highlight](images/generate_snippet_from_highlight.gif)

### Snippet: Save snippet to language snippets file

Select text, run the command, answer the same prompts, then pick a language
from the dropdown — the current file's language is detected automatically and
suggested first. The snippet is written directly into that language's user
snippets file (e.g. `snippets/sql.json` in your VS Code user folder) and works
immediately. Existing comments in the snippets file are preserved, and you are
asked before an existing snippet with the same name is overwritten.

## Extension Settings

* `vs-code-snippet-generator.preserveIndentation` (default `false`): keep the
  leading whitespace of each selected line instead of trimming it.

## Notes

* `$` and `\` in the selected text are kept as-is, so you can hand-edit
  tabstops (`$1`, `${1:placeholder}`) into the generated snippet body. Escape
  them manually (`\\$`) if you need literal characters.

## Release Notes

### 1.2.0

* New command **Snippet: Save snippet to language snippets file** — saves the
  snippet directly into the chosen language's user snippets file, with a
  language dropdown that auto-detects the current file's language.
* Fixed `preserveIndentation` setting default (was the string `"false"`, which
  behaved as enabled) — indentation is now trimmed by default as documented.
* Modernized the codebase: TypeScript 5, ESLint, async/await, unit tests.

### 1.1.0 (2019-11-09)

* Add setting to preserve indentation

### 1.0.2 (2019-11-09)

* Add extension icon

### 1.0.1

* Release notes adjustment

### 1.0.0

* Description now has default value the same as the previously entered name
* Add howto animated image

### 0.0.1

* Initial release of extension
