import * as vscode from 'vscode';

/**
 * The user snippets directory, derived from globalStorageUri
 * (always <userDataDir>/User/globalStorage/<extension-id>), so it works
 * across Code/Insiders/VSCodium and portable installs without hardcoded paths.
 */
export function getSnippetsFileUri(context: vscode.ExtensionContext, languageId: string): vscode.Uri {
    return vscode.Uri.joinPath(context.globalStorageUri, '..', '..', 'snippets', `${languageId}.json`);
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
