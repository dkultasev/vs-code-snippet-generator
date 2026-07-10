import {
    applyEdits,
    findNodeAtLocation,
    modify,
    parse,
    parseTree,
    printParseErrorCode,
    type ParseError,
} from 'jsonc-parser';

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

const FORMATTING = { formattingOptions: { insertSpaces: true, tabSize: 4, eol: '\n' } };

/**
 * Inserts or replaces one snippet in the given snippets-file content,
 * preserving all existing comments and formatting.
 */
export function upsertSnippet(content: string, name: string, snippet: Snippet): string {
    const base = content.trim().length === 0 ? '{}' : content;
    parseSnippetsObject(base);
    const edits = modify(base, [name], snippet, FORMATTING);
    return applyEdits(base, edits);
}

/** Removes one snippet by name, preserving comments and the other snippets. */
export function removeSnippet(content: string, name: string): string {
    parseSnippetsObject(content);
    const edits = modify(content, [name], undefined, FORMATTING);
    return applyEdits(content, edits);
}

/** Offset of the snippet's value in the file, for jump-to-snippet navigation. */
export function findSnippetOffset(content: string, name: string): number | undefined {
    const root = parseTree(content, [], PARSE_OPTIONS);
    if (!root) {
        return undefined;
    }
    const valueNode = findNodeAtLocation(root, [name]);
    // The parent is the property node, whose offset is the start of the "name" key.
    return valueNode?.parent?.offset;
}
