"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.generateSnippet', () => {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const position = editor.selection.active;
        const selectionRange = new vscode.Range(editor.selection.start, editor.selection.end);
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
                    getJson(documentText, prefix, name, description, (text) => {
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
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
function getJson(body, prefix, name, description, cb) {
    return __awaiter(this, void 0, void 0, function* () {
        let object = {};
        object[name] = {
            prefix: prefix,
            body: body.split(/\r?\n/).map(line => line.trimLeft()),
            description: description
        };
        let resultArray = JSON.stringify(object, null, 4).split(/\r?\n/);
        resultArray = resultArray.slice(1, resultArray.length - 1);
        let finalResult = resultArray.join('\n');
        cb(finalResult);
    });
}
//# sourceMappingURL=extension.js.map