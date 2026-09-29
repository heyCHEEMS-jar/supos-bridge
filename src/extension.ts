import * as vscode from 'vscode'
import { generateAll, registerGenerateTypes } from './commands/gen-types'
import { registerRestart } from './commands/restart'

export const activate = async (ctx: vscode.ExtensionContext) => {
  ctx.subscriptions.push(registerGenerateTypes(ctx), registerRestart(ctx))
  // 启动扩展时自动生成.d.ts（文件存在时跳过）
  const folders = vscode.workspace.workspaceFolders ?? []
  if (folders.length && (await generateAll(ctx, folders))) await vscode.commands.executeCommand('typescript.restartTsServer')
}

export const deactivate = () => {}
