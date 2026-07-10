import * as vscode from 'vscode';

export interface SnippetMeta {
    name: string;
    prefix: string;
    description: string;
}

export type SaveTarget =
    | { kind: 'user' }
    | { kind: 'workspace'; folder: vscode.WorkspaceFolder };

export async function promptForSnippetMeta(): Promise<SnippetMeta | undefined> {
    const name = await vscode.window.showInputBox({ prompt: 'Enter snippet name' });
    if (!name) {
        return undefined;
    }
    const prefix = await vscode.window.showInputBox({ prompt: 'Enter snippet prefix' });
    if (!prefix) {
        return undefined;
    }
    const description = await vscode.window.showInputBox({
        value: name,
        prompt: 'Enter snippet description',
    });
    if (!description) {
        return undefined;
    }
    return { name, prefix, description };
}

export async function pickLanguages(
    languages: readonly string[],
    detected: string | undefined
): Promise<string[] | undefined> {
    const items: vscode.QuickPickItem[] = [...languages]
        .sort((a, b) => a.localeCompare(b))
        .filter((language) => language !== detected)
        .map((language) => ({ label: language }));
    if (detected !== undefined && languages.includes(detected)) {
        items.unshift({ label: detected, description: '(current file)', picked: true });
    }
    const picked = await vscode.window.showQuickPick(items, {
        canPickMany: true,
        placeHolder: 'Select the language(s) this snippet is for',
    });
    if (!picked || picked.length === 0) {
        return undefined;
    }
    return picked.map((item) => item.label);
}

export async function pickTarget(): Promise<SaveTarget | undefined> {
    const folders = vscode.workspace.workspaceFolders ?? [];
    if (folders.length === 0) {
        return { kind: 'user' };
    }
    // In a remote session (SSH/WSL/containers) user snippets land in the remote
    // server profile, which VS Code does not load — warn up front.
    const userDescription =
        vscode.env.remoteName !== undefined
            ? `saved on the remote machine (${vscode.env.remoteName}) — VS Code will NOT load these`
            : 'available in every workspace';
    const picked = await vscode.window.showQuickPick(
        [
            { label: 'User snippets', description: userDescription },
            { label: 'Workspace snippets', description: 'saved under .vscode in this workspace' },
        ],
        { placeHolder: 'Where should the snippet be saved?' }
    );
    if (!picked) {
        return undefined;
    }
    if (picked.label === 'User snippets') {
        return { kind: 'user' };
    }
    if (folders.length === 1) {
        return { kind: 'workspace', folder: folders[0] };
    }
    const folder = await vscode.window.showWorkspaceFolderPick({
        placeHolder: 'Select the workspace folder to save the snippet in',
    });
    return folder ? { kind: 'workspace', folder } : undefined;
}

export async function promptFileName(defaultName: string): Promise<string | undefined> {
    const name = await vscode.window.showInputBox({
        value: defaultName,
        prompt: 'Enter the snippets file name (without the .code-snippets extension)',
        validateInput: (value) =>
            /^[\w][\w.-]*$/.test(value) ? undefined : 'Use letters, digits, ".", "-" or "_"',
    });
    return name || undefined;
}
