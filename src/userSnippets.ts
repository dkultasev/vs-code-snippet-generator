import * as vscode from 'vscode';

/**
 * The user snippets directory, derived from globalStorageUri
 * (always <userDataDir>/User/globalStorage/<extension-id>), so it works
 * across Code/Insiders/VSCodium and portable installs without hardcoded paths.
 */
export function getUserSnippetsDirUri(context: vscode.ExtensionContext): vscode.Uri {
    return vscode.Uri.joinPath(context.globalStorageUri, '..', '..', 'snippets');
}

/** User snippets file for a single language: <snippets>/<languageId>.json */
export function getLanguageSnippetsUri(
    context: vscode.ExtensionContext,
    languageId: string
): vscode.Uri {
    return vscode.Uri.joinPath(getUserSnippetsDirUri(context), `${languageId}.json`);
}

/** Global multi-language user snippets file: <snippets>/<name>.code-snippets */
export function getUserCodeSnippetsUri(
    context: vscode.ExtensionContext,
    fileName: string
): vscode.Uri {
    return vscode.Uri.joinPath(getUserSnippetsDirUri(context), `${fileName}.code-snippets`);
}

/** Workspace snippets file: <folder>/.vscode/<name>.code-snippets */
export function getWorkspaceSnippetsUri(
    folder: vscode.WorkspaceFolder,
    fileName: string
): vscode.Uri {
    return vscode.Uri.joinPath(folder.uri, '.vscode', `${fileName}.code-snippets`);
}

export interface SnippetFileEntry {
    uri: vscode.Uri;
    label: string;
    description: string;
}

async function listDirectory(
    dir: vscode.Uri,
    matches: (name: string) => boolean,
    description: string
): Promise<SnippetFileEntry[]> {
    try {
        const entries = await vscode.workspace.fs.readDirectory(dir);
        return entries
            .filter(([name, type]) => type === vscode.FileType.File && matches(name))
            .map(([name]) => ({ uri: vscode.Uri.joinPath(dir, name), label: name, description }));
    } catch {
        // directory does not exist yet
        return [];
    }
}

/** All snippet files this extension can manage: user dir + workspace .vscode dirs. */
export async function listSnippetFiles(
    context: vscode.ExtensionContext
): Promise<SnippetFileEntry[]> {
    const files = await listDirectory(
        getUserSnippetsDirUri(context),
        (name) => name.endsWith('.json') || name.endsWith('.code-snippets'),
        'User'
    );
    for (const folder of vscode.workspace.workspaceFolders ?? []) {
        files.push(
            ...(await listDirectory(
                vscode.Uri.joinPath(folder.uri, '.vscode'),
                (name) => name.endsWith('.code-snippets'),
                `Workspace: ${folder.name}`
            ))
        );
    }
    return files;
}

export async function readFileIfExists(uri: vscode.Uri): Promise<string | undefined> {
    try {
        return new TextDecoder().decode(await vscode.workspace.fs.readFile(uri));
    } catch (error) {
        if (error instanceof vscode.FileSystemError && error.code === 'FileNotFound') {
            return undefined;
        }
        throw error;
    }
}

export async function writeTextFile(uri: vscode.Uri, content: string): Promise<void> {
    await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(uri, '..'));
    await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(content));
}
