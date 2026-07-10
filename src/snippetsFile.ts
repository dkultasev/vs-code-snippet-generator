import { applyEdits, modify, parse, printParseErrorCode, type ParseError } from 'jsonc-parser';

import type { Snippet } from './snippet';

// User snippet files are JSONC: VS Code itself seeds new ones with comments,
// so they must never go through plain JSON.parse/JSON.stringify.
const PARSE_OPTIONS = { allowTrailingComma: true };

function parseSnippetsObject(content: string): Record<string, unknown> {
    const errors: ParseError[] = [];
    const value: unknown = parse(content, errors, PARSE_OPTIONS);
    if (errors.length > 0) {
        const [first] = errors;
        throw new Error(
            `snippets file is not valid JSON with comments: ` +
                `${printParseErrorCode(first.error)} at offset ${first.offset}`
        );
    }
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error('snippets file does not contain a JSON object at the top level');
    }
    return value as Record<string, unknown>;
}

export function listSnippetNames(content: string): string[] {
    if (content.trim().length === 0) {
        return [];
    }
    return Object.keys(parseSnippetsObject(content));
}

/**
 * Inserts or replaces one snippet in the given snippets-file content,
 * preserving all existing comments and formatting.
 */
export function upsertSnippet(content: string, name: string, snippet: Snippet): string {
    const base = content.trim().length === 0 ? '{}' : content;
    parseSnippetsObject(base);
    const edits = modify(base, [name], snippet, {
        formattingOptions: { insertSpaces: true, tabSize: 4, eol: '\n' },
    });
    return applyEdits(base, edits);
}
