import * as vscode from 'vscode'

export const runWithProgress = async <T>(title: string, task: () => Promise<T>) =>
  vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title }, task)
