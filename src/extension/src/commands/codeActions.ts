import * as vscode from 'vscode';
import { ChatViewProvider } from '../providers/ChatViewProvider.js';

/**
 * Đăng ký các lệnh ngữ cảnh thao tác mã nguồn (Explain, Fix, Generate Tests)
 * cho menu chuột phải và Command Palette.
 */
export function registerCodeActionCommands(chatProvider: ChatViewProvider): vscode.Disposable[] {
  return [
    vscode.commands.registerCommand('nescode.explainCode', async () => {
      await chatProvider.executeEditorPrompt('explain');
    }),
    vscode.commands.registerCommand('nescode.fixCode', async () => {
      await chatProvider.executeEditorPrompt('fix');
    }),
    vscode.commands.registerCommand('nescode.generateTests', async () => {
      await chatProvider.executeEditorPrompt('generate_tests');
    })
  ];
}
