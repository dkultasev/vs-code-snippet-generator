import * as vscode from 'vscode';

import { pickLanguage, promptForSnippetMeta } from './prompts';
import { buildSnippet, renderSnippetBlock } from './snippet';
import { listSnippetNames, upsertSnippet } from './snippetsFile';
import { getSnippetsFileUri, readFileIfExists, writeTextFile } from './userSnippets';

function preserveIndentation(): boolean {
    return vscode.workspace
        .getConfiguration('vs-code-snippet-generator')
        .get<boolean>('preserveIndentation', false);
}

async function generateSnippet(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    const selection = editor.selection;
    const text = editor.document.getText(selection);

    const meta = await promptForSnippetMeta();
    if (!meta) {
        return;
    }

    const snippet = buildSnippet(text, meta.prefix, meta.description, preserveIndentation());
    const block = renderSnippetBlock(meta.name, snippet);
    await editor.edit((edit) => edit.replace(selection, block));
}

async function saveSnippet(context: vscode.ExtensionContext): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.selection.isEmpty) {
        void vscode.window.showWarningMessage('Select the text to save as a snippet first.');
        return;
    }
    const text = editor.document.getText(editor.selection);

    const meta = await promptForSnippetMeta();
    if (!meta) {
        return;
    }

    const languages = await vscode.languages.getLanguages();
    const language = await pickLanguage(languages, editor.document.languageId);
    if (!language) {
        return;
    }

    const fileUri = getSnippetsFileUri(context, language);
    const existing = await readFileIfExists(fileUri);
    if (existing !== undefined && listSnippetNames(existing).includes(meta.name)) {
        const choice = await vscode.window.showWarningMessage(
            `Snippet "${meta.name}" already exists in ${language}.json. Overwrite it?`,
            { modal: true },
            'Overwrite'
        );
        if (choice !== 'Overwrite') {
            return;
        }
    }

    const snippet = buildSnippet(text, meta.prefix, meta.description, preserveIndentation());
    await writeTextFile(fileUri, upsertSnippet(existing ?? '', meta.name, snippet));

    const open = await vscode.window.showInformationMessage(
        `Saved snippet "${meta.name}" to ${language}.json.`,
        'Open file'
    );
    if (open === 'Open file') {
        await vscode.window.showTextDocument(fileUri);
    }
}

function withErrorReporting(run: () => Promise<void>): () => Promise<void> {
    return async () => {
        try {
            await run();
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            void vscode.window.showErrorMessage(`Snippet generator: ${message}`);
        }
    };
}

export function activate(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.generateSnippet', withErrorReporting(generateSnippet)),
        vscode.commands.registerCommand(
            'vs-code-snippet-generator.saveSnippet',
            withErrorReporting(() => saveSnippet(context))
        )
    );
}

export function deactivate(): void {
    // nothing to clean up
}
