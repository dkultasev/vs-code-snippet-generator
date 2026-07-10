import * as vscode from 'vscode';

export interface SnippetMeta {
    name: string;
    prefix: string;
    description: string;
}

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

export async function pickLanguage(
    languages: readonly string[],
    detected: string | undefined
): Promise<string | undefined> {
    const items: vscode.QuickPickItem[] = [...languages]
        .sort((a, b) => a.localeCompare(b))
        .filter((language) => language !== detected)
        .map((language) => ({ label: language }));
    if (detected !== undefined && languages.includes(detected)) {
        items.unshift({ label: detected, description: '(current file)' });
    }
    const picked = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select the language this snippet is for',
    });
    return picked?.label;
}
