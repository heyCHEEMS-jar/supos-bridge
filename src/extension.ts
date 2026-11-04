import * as vscode from 'vscode'
import { generateAll, registerGenerateTypes } from './commands/gen-types'
import { registerLogin } from './commands/login'
import { registerRestart } from './commands/restart'
import { registerSelectApp } from './commands/select-app'
import { registerSelectComponent } from './commands/select-component'
import { loadApps } from './utils/apps'
import { TicketExpiredError } from './utils/request'

export const activate = async (ctx: vscode.ExtensionContext) => {
  try {
    ctx.subscriptions.push(registerGenerateTypes(ctx), registerRestart(ctx), registerLogin(ctx), registerSelectApp(ctx), registerSelectComponent(ctx))

    if (await ctx.secrets.get('ticket')) {
      try {
        await loadApps(ctx, { autoLogin: false })
      } catch (err) {
        if (!(err instanceof TicketExpiredError)) throw err
        vscode.window.showWarningMessage(vscode.l10n.t('Ticket expired, please log in again'))
      }
    }

    // 启动后自动生成.d.ts（文件存在时跳过）
    const folders = vscode.workspace.workspaceFolders ?? []
    if (folders.length && (await generateAll(ctx, folders))) await vscode.commands.executeCommand('typescript.restartTsServer')
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    vscode.window.showErrorMessage(vscode.l10n.t('Startup failed: {0}', message))
  }
}

export const deactivate = () => {}
