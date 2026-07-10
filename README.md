# VS Code Snippet Generator

Turn selected text into a VS Code snippet — as a JSON block to paste somewhere
yourself, or saved straight into user or workspace snippets for the languages
you pick. All commands are in the command palette and in the editor
right-click menu (when text is selected).

## Features

### Snippet: Generate snippet JSON block

Select text, run the command, answer the name/prefix/description prompts, and
the selection is replaced with the snippet JSON block, ready to paste into any
snippets file.

![Generate snippet from highlight](images/generate_snippet_from_highlight.gif)

### Snippet: Save snippet to language snippets file

Select text, run the command, answer the same prompts, then:

* **Pick language(s)** — the current file's language is detected automatically,
  listed first and pre-selected; pick as many as the snippet should apply to.
* **Pick the target** — your user snippets (available everywhere) or the
  workspace's `.vscode` folder (shared with your team via the repo).

A single language saved to user snippets goes into the classic
`snippets/<language>.json`; multiple languages or a workspace target produce a
`.code-snippets` file with a `scope` (e.g. `"scope": "javascript,typescript"`).
Existing comments in snippet files are preserved, and you are asked before an
existing snippet with the same name is overwritten.

### Snippet: Wrap selection as tabstop placeholder

Select the part of a snippet body that should become a placeholder and run the
command — the selection becomes `${1:selected text}`, numbering continues from
the highest tabstop already in the file. Works with multiple cursors.

### Snippet: Manage saved snippets

Browse your snippet files (user + workspace), pick a snippet, then jump to it
in the editor or delete it.

## Extension Settings

* `vs-code-snippet-generator.indentation` (default `dedent`): how leading
  whitespace is handled — `dedent` strips only the indentation all lines share
  (keeps relative nesting), `trim` strips it all, `preserve` keeps every line
  as selected.
* `vs-code-snippet-generator.escapeSnippetSpecialCharacters` (default `false`):
  escape `$` and `\` so the selected text is reproduced literally instead of
  `$…` being interpreted as tabstops.
* `vs-code-snippet-generator.preserveIndentation` — deprecated, use
  `indentation` instead (still honored if you had set it).

## Development

* `npm run lint` / `npm test` — ESLint + mocha unit tests.
* `npm run bundle` — esbuild bundle to `dist/extension.js`.
* CI (GitHub Actions) lints, tests and packages a `.vsix` artifact on every
  push/PR; pushing a `v*` tag publishes to the marketplace (requires the
  `VSCE_PAT` repository secret).

## Release Notes

See [CHANGELOG.md](CHANGELOG.md).
