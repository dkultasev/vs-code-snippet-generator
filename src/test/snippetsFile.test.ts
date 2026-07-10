import * as assert from 'node:assert/strict';
import { parse } from 'jsonc-parser';

import { listSnippetNames, upsertSnippet } from '../snippetsFile';

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
