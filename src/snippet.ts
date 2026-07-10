export interface Snippet {
    prefix: string;
    body: string[];
    description: string;
}

export function buildSnippet(
    text: string,
    prefix: string,
    description: string,
    preserveIndentation: boolean
): Snippet {
    return {
        prefix,
        body: text.split(/\r?\n/).map((line) => (preserveIndentation ? line : line.trimStart())),
        description,
    };
}

/**
 * Renders the snippet as the inner JSON block (without surrounding braces),
 * ready to be pasted into a snippets file — the original extension output format.
 */
export function renderSnippetBlock(name: string, snippet: Snippet): string {
    const lines = JSON.stringify({ [name]: snippet }, null, 4).split('\n');
    return lines.slice(1, -1).join('\n');
}
