import * as assert from 'node:assert/strict';
import { parse } from 'jsonc-parser';

import { findSnippetOffset, listSnippetNames, removeSnippet, upsertSnippet } from '../snippetsFile';

const SNIPPET = { prefix: 'prfx', body: ['line one', 'line two'], description: 'dscr' };

describe('upsertSnippet', () => {
    it('creates a fresh object for empty content', () => {
        const result = upsertSnippet('', 'My Snippet', SNIPPET);
        assert.deepEqual(parse(result), { 'My Snippet': SNIPPET });
    });

    it('adds to an existing file without touching other snippets', () => {
        const existing = upsertSnippet('', 'First', SNIPPET);
        const result = upsertSnippet(existing, 'Second', { ...SNIPPET, prefix: 'other' });
        assert.deepEqual(Object.keys(parse(result) as Record<string, unknown>), ['First', 'Second']);
    });

    it('preserves comments in an existing JSONC file', () => {
        const existing = [
            '{',
            '    // keep this comment',
            '    "First": { "prefix": "a", "body": ["x"], "description": "d" }',
            '}',
        ].join('\n');
        const result = upsertSnippet(existing, 'Second', SNIPPET);
        assert.ok(result.includes('// keep this comment'), 'comment was lost');
        const parsed = parse(result, [], { allowTrailingComma: true }) as Record<string, unknown>;
        assert.deepEqual(Object.keys(parsed), ['First', 'Second']);
    });

    it('replaces an existing snippet with the same name', () => {
        const existing = upsertSnippet('', 'My Snippet', SNIPPET);
        const result = upsertSnippet(existing, 'My Snippet', { ...SNIPPET, prefix: 'updated' });
        const parsed = parse(result) as Record<string, { prefix: string }>;
        assert.equal(parsed['My Snippet'].prefix, 'updated');
        assert.deepEqual(Object.keys(parsed), ['My Snippet']);
    });

    it('throws on a file that is not valid JSONC', () => {
        assert.throws(() => upsertSnippet('{ "broken', 'X', SNIPPET), /not valid JSON with comments/);
    });

    it('throws when the top level is not an object', () => {
        assert.throws(() => upsertSnippet('[1, 2]', 'X', SNIPPET), /JSON object at the top level/);
    });
});

describe('upsertSnippet with scope', () => {
    it('serializes scope between prefix and body', () => {
        const scoped = {
            prefix: SNIPPET.prefix,
            scope: 'javascript,typescript',
            body: SNIPPET.body,
            description: SNIPPET.description,
        };
        const result = upsertSnippet('', 'Scoped', scoped);
        const parsed = parse(result) as Record<string, Record<string, unknown>>;
        assert.deepEqual(Object.keys(parsed.Scoped), ['prefix', 'scope', 'body', 'description']);
        assert.equal(parsed.Scoped.scope, 'javascript,typescript');
    });
});

describe('removeSnippet', () => {
    it('removes the named snippet and keeps the others', () => {
        const content = upsertSnippet(upsertSnippet('', 'First', SNIPPET), 'Second', SNIPPET);
        const result = removeSnippet(content, 'First');
        assert.deepEqual(Object.keys(parse(result) as Record<string, unknown>), ['Second']);
    });

    it('preserves comments when deleting', () => {
        const content = [
            '{',
            '    // keep this comment',
            '    "First": { "prefix": "a", "body": ["x"], "description": "d" },',
            '    "Second": { "prefix": "b", "body": ["y"], "description": "e" }',
            '}',
        ].join('\n');
        const result = removeSnippet(content, 'Second');
        assert.ok(result.includes('// keep this comment'), 'comment was lost');
        assert.deepEqual(listSnippetNames(result), ['First']);
    });
});

describe('findSnippetOffset', () => {
    it('returns the offset of the snippet key', () => {
        const content = upsertSnippet(upsertSnippet('', 'First', SNIPPET), 'Second', SNIPPET);
        const offset = findSnippetOffset(content, 'Second');
        assert.ok(offset !== undefined);
        assert.ok(content.slice(offset).startsWith('"Second"'));
    });

    it('returns undefined for a missing snippet', () => {
        const content = upsertSnippet('', 'First', SNIPPET);
        assert.equal(findSnippetOffset(content, 'Nope'), undefined);
    });
});

describe('listSnippetNames', () => {
    it('returns an empty list for empty content', () => {
        assert.deepEqual(listSnippetNames(''), []);
        assert.deepEqual(listSnippetNames('   \n'), []);
    });

    it('lists names from a JSONC file with comments and trailing commas', () => {
        const content = [
            '{',
            '    // a comment',
            '    "One": { "prefix": "a", "body": ["x"], "description": "d" },',
            '    "Two": { "prefix": "b", "body": ["y"], "description": "e" },',
            '}',
        ].join('\n');
        assert.deepEqual(listSnippetNames(content), ['One', 'Two']);
    });
});
