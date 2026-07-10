import * as assert from 'node:assert/strict';

import { buildSnippet, renderSnippetBlock } from '../snippet';

describe('buildSnippet', () => {
    it('returns a single-line body as one element', () => {
        const snippet = buildSnippet('single line', 'prfx', 'dscr', false);
        assert.deepEqual(snippet, {
            prefix: 'prfx',
            body: ['single line'],
            description: 'dscr',
        });
    });

    it('splits multi-line text on \\n and \\r\\n', () => {
        const snippet = buildSnippet('first\nsecond\r\nthird', 'p', 'd', false);
        assert.deepEqual(snippet.body, ['first', 'second', 'third']);
    });

    it('trims leading whitespace by default', () => {
        const snippet = buildSnippet('  single line \n\t\tsecond line\t', 'p', 'd', false);
        assert.deepEqual(snippet.body, ['single line ', 'second line\t']);
    });

    it('keeps leading whitespace when preserveIndentation is set', () => {
        const snippet = buildSnippet('  indented\n\tmore', 'p', 'd', true);
        assert.deepEqual(snippet.body, ['  indented', '\tmore']);
    });
});

describe('renderSnippetBlock', () => {
    it('renders the brace-stripped JSON block in the original output format', () => {
        const block = renderSnippetBlock('nm', {
            prefix: 'prfx',
            body: ['line'],
            description: 'dscr',
        });
        assert.equal(
            block,
            [
                '    "nm": {',
                '        "prefix": "prfx",',
                '        "body": [',
                '            "line"',
                '        ],',
                '        "description": "dscr"',
                '    }',
            ].join('\n')
        );
    });
});
