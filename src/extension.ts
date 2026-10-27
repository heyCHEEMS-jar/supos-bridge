import * as vscode from 'vscode'
import { generateAll, registerGenerateTypes } from './commands/gen-types'
import { registerLogin } from './commands/login'
import { registerRestart } from './commands/restart'

export const activate = async (ctx: vscode.ExtensionContext) => {
  // 启动后自动生成.d.ts（文件存在时跳过）
  const folders = vscode.workspace.workspaceFolders ?? []
  if (folders.length && (await generateAll(ctx, folders))) await vscode.commands.executeCommand('typescript.restartTsServer')

  ctx.subscriptions.push(registerGenerateTypes(ctx), registerRestart(ctx), registerLogin(ctx))
}

export const deactivate = () => {}
