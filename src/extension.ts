import * as vscode from 'vscode';
export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('extension.generateSnippet', () => {
		let editor = vscode.window.activeTextEditor;

		if (!editor) {
			return;
		}

		const position = editor.selection.active;

		const selectionRange = new vscode.Range(
			editor.selection.start,
			editor.selection.end
		);
		var documentText = editor.document.getText(selectionRange);

		vscode.window.showInputBox({
			prompt: 'Enter snippet name'
		}).then((name) => {
			if (!name) {
				return;
			}
			vscode.window.showInputBox({
				prompt: 'Enter snippet prefix'
			}).then((prefix) => {
				if (!prefix) {
					return;
				}
				vscode.window.showInputBox({
					value: name,
					prompt: 'Enter snippet description'
				}).then((description) => {
					if (!description) {
						return;
					}
					getJson(documentText, prefix, name, description, (text: string) => {
						if (!editor) {
							return;
						}

						editor.edit((textEdit) => {
							textEdit.delete(selectionRange);
							textEdit.insert(position, text);

						});
					});

				}, (error) => {
					console.log(error);
				});
			}, (error) => {
				console.log(error);
			});
		}, (error) => {
			console.log(error);
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }


async function getJson(body: string, prefix: string, name: string, description: string, cb: any) {
	let object: Record<string, { prefix: string, body: string[], description: string }> = {};

	object[name] = {
		prefix: prefix,
		body: body.split(/\r?\n/).map(line => line.trimLeft()),
		description: description
	};

	let resultArray = JSON.stringify(object, null, 4).split(/\r?\n/);
	resultArray = resultArray.slice(1, resultArray.length - 1);
	let finalResult = resultArray.join('\n');
	cb(finalResult);
}

