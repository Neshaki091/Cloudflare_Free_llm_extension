import * as vscode from 'vscode';

export function registerOpenChatCommand(): vscode.Disposable {
  return vscode.commands.registerCommand('nescode.openChat', async () => {
    await vscode.commands.executeCommand('nescode.chatView.focus');
  });
}

