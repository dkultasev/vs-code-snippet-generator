import * as assert from 'node:assert/strict';

import { buildSnippet, nextTabstopIndex, renderSnippetBlock, type BuildOptions } from '../snippet';

const TRIM: BuildOptions = { indentation: 'trim', escapeSpecialCharacters: false };
const DEDENT: BuildOptions = { indentation: 'dedent', escapeSpecialCharacters: false };
const PRESERVE: BuildOptions = { indentation: 'preserve', escapeSpecialCharacters: false };

describe('buildSnippet', () => {
    it('returns a single-line body as one element', () => {
        const snippet = buildSnippet('single line', 'prfx', 'dscr', TRIM);
        assert.deepEqual(snippet, {
            prefix: 'prfx',
            body: ['single line'],
            description: 'dscr',
        });
    });

    it('splits multi-line text on \\n and \\r\\n', () => {
        const snippet = buildSnippet('first\nsecond\r\nthird', 'p', 'd', TRIM);
        assert.deepEqual(snippet.body, ['first', 'second', 'third']);
    });

    it('trim mode strips all leading whitespace', () => {
        const snippet = buildSnippet('  single line \n\t\tsecond line\t', 'p', 'd', TRIM);
        assert.deepEqual(snippet.body, ['single line ', 'second line\t']);
    });

    it('preserve mode keeps leading whitespace as-is', () => {
        const snippet = buildSnippet('  indented\n\tmore', 'p', 'd', PRESERVE);
        assert.deepEqual(snippet.body, ['  indented', '\tmore']);
    });

    it('dedent strips only the common indentation, keeping relative nesting', () => {
        const text = ['        if (x) {', '            y();', '        }'].join('\n');
        const snippet = buildSnippet(text, 'p', 'd', DEDENT);
        assert.deepEqual(snippet.body, ['if (x) {', '    y();', '}']);
    });

    it('dedent works with tab indentation', () => {
        const snippet = buildSnippet('\t\tfoo\n\t\t\tbar', 'p', 'd', DEDENT);
        assert.deepEqual(snippet.body, ['foo', '\tbar']);
    });

    it('dedent ignores blank lines when finding the common indent', () => {
        const snippet = buildSnippet('    a\n\n    b', 'p', 'd', DEDENT);
        assert.deepEqual(snippet.body, ['a', '', 'b']);
    });

    it('dedent leaves already-flush text untouched', () => {
        const snippet = buildSnippet('a\n    b', 'p', 'd', DEDENT);
        assert.deepEqual(snippet.body, ['a', '    b']);
    });

    it('escapes backslashes and dollar signs when enabled', () => {
        const snippet = buildSnippet('price: $10 c:\\temp', 'p', 'd', {
            ...TRIM,
            escapeSpecialCharacters: true,
        });
        assert.deepEqual(snippet.body, ['price: \\$10 c:\\\\temp']);
    });

    it('leaves $ and \\ untouched by default', () => {
        const snippet = buildSnippet('$1 and \\n', 'p', 'd', TRIM);
        assert.deepEqual(snippet.body, ['$1 and \\n']);
    });

    it('includes scope after prefix when given', () => {
        const snippet = buildSnippet('x', 'p', 'd', { ...TRIM, scope: 'javascript,typescript' });
        assert.deepEqual(Object.keys(snippet), ['prefix', 'scope', 'body', 'description']);
        assert.equal(snippet.scope, 'javascript,typescript');
    });

    it('omits scope when not given', () => {
        const snippet = buildSnippet('x', 'p', 'd', TRIM);
        assert.ok(!('scope' in snippet));
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

describe('nextTabstopIndex', () => {
    it('returns 1 when the text has no tabstops', () => {
        assert.equal(nextTabstopIndex('plain text $ not-a-tabstop ${name}'), 1);
    });

    it('handles the $n form', () => {
        assert.equal(nextTabstopIndex('foo $1 bar $3'), 4);
    });

    it('handles the ${n:placeholder} and ${n|choice|} forms', () => {
        assert.equal(nextTabstopIndex('a ${2:x} b ${5|one,two|}'), 6);
    });

    it('takes the maximum across mixed forms', () => {
        assert.equal(nextTabstopIndex('$9 and ${4:x}'), 10);
    });
});
