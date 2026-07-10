import * as vscode from 'vscode';

import { pickLanguages, pickTarget, promptFileName, promptForSnippetMeta } from './prompts';
import {
    buildSnippet,
    nextTabstopIndex,
    renderSnippetBlock,
    type BuildOptions,
    type IndentationMode,
} from './snippet';
import { findSnippetOffset, listSnippetNames, removeSnippet, upsertSnippet } from './snippetsFile';
import {
    getLanguageSnippetsUri,
    getUserCodeSnippetsUri,
    getWorkspaceSnippetsUri,
    listSnippetFiles,
    readFileIfExists,
    writeTextFile,
} from './userSnippets';

function buildOptions(scope?: string): BuildOptions {
    const config = vscode.workspace.getConfiguration('vs-code-snippet-generator');
    // The deprecated boolean wins when the user explicitly set it anywhere.
    const legacy = config.inspect<boolean>('preserveIndentation');
    const legacyIsSet =
        legacy !== undefined &&
        (legacy.globalValue !== undefined ||
            legacy.workspaceValue !== undefined ||
            legacy.workspaceFolderValue !== undefined);
    const indentation: IndentationMode = legacyIsSet
        ? config.get<boolean>('preserveIndentation', false)
            ? 'preserve'
            : 'trim'
        : config.get<IndentationMode>('indentation', 'dedent');
    return {
        indentation,
        escapeSpecialCharacters: config.get<boolean>('escapeSnippetSpecialCharacters', false),
        scope,
    };
}

function fileDisplayName(uri: vscode.Uri): string {
    return uri.path.split('/').pop() ?? uri.path;
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

    const snippet = buildSnippet(text, meta.prefix, meta.description, buildOptions());
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
    const picked = await pickLanguages(languages, editor.document.languageId);
    if (!picked) {
        return;
    }

    const target = await pickTarget();
    if (!target) {
        return;
    }

    // A single language in user snippets goes to the plain <lang>.json file;
    // everything else is a .code-snippets file with an explicit scope.
    let fileUri: vscode.Uri;
    let scope: string | undefined;
    if (target.kind === 'user' && picked.length === 1) {
        fileUri = getLanguageSnippetsUri(context, picked[0]);
    } else {
        scope = picked.join(',');
        const fileName = await promptFileName(target.kind === 'user' ? 'global' : 'project');
        if (!fileName) {
            return;
        }
        fileUri =
            target.kind === 'user'
                ? getUserCodeSnippetsUri(context, fileName)
                : getWorkspaceSnippetsUri(target.folder, fileName);
    }

    const displayName = fileDisplayName(fileUri);
    const existing = await readFileIfExists(fileUri);
    if (existing !== undefined && listSnippetNames(existing).includes(meta.name)) {
        const choice = await vscode.window.showWarningMessage(
            `Snippet "${meta.name}" already exists in ${displayName}. Overwrite it?`,
            { modal: true },
            'Overwrite'
        );
        if (choice !== 'Overwrite') {
            return;
        }
    }

    const snippet = buildSnippet(text, meta.prefix, meta.description, buildOptions(scope));
    await writeTextFile(fileUri, upsertSnippet(existing ?? '', meta.name, snippet));

    const savedRemotely = target.kind === 'user' && vscode.env.remoteName !== undefined;
    const notify = savedRemotely ? vscode.window.showWarningMessage : vscode.window.showInformationMessage;
    const message = savedRemotely
        ? `Saved snippet "${meta.name}" to ${fileUri.fsPath} on the remote machine — ` +
          'VS Code does not load remote user snippets; use the Workspace target instead.'
        : `Saved snippet "${meta.name}" to ${fileUri.fsPath}.`;
    const open = await notify(message, 'Open file');
    if (open === 'Open file') {
        await vscode.window.showTextDocument(fileUri);
    }
}

async function wrapAsTabstop(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    const selections = editor
        ? [...editor.selections].filter((selection) => !selection.isEmpty)
        : [];
    if (!editor || selections.length === 0) {
        void vscode.window.showWarningMessage('Select the text to wrap as a tabstop first.');
        return;
    }
    selections.sort((a, b) => a.start.compareTo(b.start));
    let index = nextTabstopIndex(editor.document.getText());
    await editor.edit((edit) => {
        for (const selection of selections) {
            edit.replace(selection, `\${${index}:${editor.document.getText(selection)}}`);
            index += 1;
        }
    });
}

async function manageSnippets(context: vscode.ExtensionContext): Promise<void> {
    const files = await listSnippetFiles(context);
    if (files.length === 0) {
        void vscode.window.showInformationMessage('No snippet files found.');
        return;
    }
    const filePick = await vscode.window.showQuickPick(
        files.map((file) => ({ label: file.label, description: file.description, uri: file.uri })),
        { placeHolder: 'Select a snippets file' }
    );
    if (!filePick) {
        return;
    }

    const content = await readFileIfExists(filePick.uri);
    if (content === undefined) {
        return;
    }
    const names = listSnippetNames(content);
    if (names.length === 0) {
        void vscode.window.showInformationMessage(`No snippets in ${filePick.label}.`);
        return;
    }
    const name = await vscode.window.showQuickPick(names, { placeHolder: 'Select a snippet' });
    if (!name) {
        return;
    }

    const action = await vscode.window.showQuickPick(['Open in editor', 'Delete'], {
        placeHolder: `Snippet "${name}"`,
    });
    if (action === 'Open in editor') {
        const document = await vscode.workspace.openTextDocument(filePick.uri);
        const editor = await vscode.window.showTextDocument(document);
        const offset = findSnippetOffset(content, name);
        if (offset !== undefined) {
            const position = document.positionAt(offset);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(
                new vscode.Range(position, position),
                vscode.TextEditorRevealType.InCenter
            );
        }
    } else if (action === 'Delete') {
        const confirm = await vscode.window.showWarningMessage(
            `Delete snippet "${name}" from ${filePick.label}?`,
            { modal: true },
            'Delete'
        );
        if (confirm !== 'Delete') {
            return;
        }
        await writeTextFile(filePick.uri, removeSnippet(content, name));
        void vscode.window.showInformationMessage(`Deleted snippet "${name}".`);
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
        ),
        vscode.commands.registerCommand(
            'vs-code-snippet-generator.wrapAsTabstop',
            withErrorReporting(wrapAsTabstop)
        ),
        vscode.commands.registerCommand(
            'vs-code-snippet-generator.manageSnippets',
            withErrorReporting(() => manageSnippets(context))
        )
    );
}

export function deactivate(): void {
    // nothing to clean up
}
