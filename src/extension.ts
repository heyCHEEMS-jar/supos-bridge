import * as vscode from 'vscode'
import { generateAll, registerGenerateTypes } from './commands/gen-types'
import { registerLogin } from './commands/login'
import { registerPullComponent } from './commands/pull-component'
import { registerRestart } from './commands/restart'
import { registerSelectApp } from './commands/select-app'
import { registerSelectComponent } from './commands/select-component'
import { registerPushComponent } from './commands/push-component'
import { store } from './store'

export const activate = async (ctx: vscode.ExtensionContext) => {
  try {
    // compFiles持久存储恢复到当前store实例运行内存中
    store.restoreCompFiles(ctx)
    // 注册commands
    ctx.subscriptions.push(
      registerGenerateTypes(ctx),
      registerRestart(ctx),
      registerLogin(ctx),
      registerSelectApp(ctx),
      registerSelectComponent(ctx),
      registerPullComponent(ctx),
      registerPushComponent(ctx)
    )

    // 启动后自动生成.d.ts（文件存在时跳过）
    const folders = vscode.workspace.workspaceFolders ?? []
    if (folders.length && (await generateAll(ctx, folders))) await vscode.commands.executeCommand('typescript.restartTsServer')
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    vscode.window.showErrorMessage(vscode.l10n.t('Startup failed: {0}', message))
  }
}

export const deactivate = () => {}
