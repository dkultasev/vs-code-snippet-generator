export type IndentationMode = 'dedent' | 'trim' | 'preserve';

export interface Snippet {
    prefix: string;
    scope?: string;
    body: string[];
    description: string;
}

export interface BuildOptions {
    indentation: IndentationMode;
    escapeSpecialCharacters: boolean;
    scope?: string;
}

function commonIndent(lines: string[]): string {
    const indents = lines
        .filter((line) => line.trim().length > 0)
        .map((line) => line.slice(0, line.length - line.trimStart().length));
    let prefix = indents[0] ?? '';
    for (const indent of indents) {
        let i = 0;
        while (i < prefix.length && i < indent.length && prefix[i] === indent[i]) {
            i += 1;
        }
        prefix = prefix.slice(0, i);
        if (prefix.length === 0) {
            break;
        }
    }
    return prefix;
}

function applyIndentation(lines: string[], mode: IndentationMode): string[] {
    switch (mode) {
        case 'preserve':
            return lines;
        case 'trim':
            return lines.map((line) => line.trimStart());
        case 'dedent': {
            const indent = commonIndent(lines);
            return lines.map((line) =>
                line.startsWith(indent) ? line.slice(indent.length) : line.trimStart()
            );
        }
    }
}

// Backslashes first, otherwise the backslash added for `$` would be doubled.
function escapeSpecialCharacters(line: string): string {
    return line.replace(/\\/g, '\\\\').replace(/\$/g, '\\$');
}

export function buildSnippet(
    text: string,
    prefix: string,
    description: string,
    options: BuildOptions
): Snippet {
    let body = applyIndentation(text.split(/\r?\n/), options.indentation);
    if (options.escapeSpecialCharacters) {
        body = body.map(escapeSpecialCharacters);
    }
    // Key order matters for the serialized snippet: prefix, scope, body, description.
    return options.scope === undefined
        ? { prefix, body, description }
        : { prefix, scope: options.scope, body, description };
}

/**
 * Renders the snippet as the inner JSON block (without surrounding braces),
 * ready to be pasted into a snippets file — the original extension output format.
 */
export function renderSnippetBlock(name: string, snippet: Snippet): string {
    const lines = JSON.stringify({ [name]: snippet }, null, 4).split('\n');
    return lines.slice(1, -1).join('\n');
}

const TABSTOP_PATTERN = /\$(\d+)|\$\{(\d+)/g;

/** The next free tabstop index: one past the highest `$n` / `${n...}` in the text. */
export function nextTabstopIndex(text: string): number {
    let max = 0;
    for (const match of text.matchAll(TABSTOP_PATTERN)) {
        const index = Number(match[1] ?? match[2]);
        if (index > max) {
            max = index;
        }
    }
    return max + 1;
}
