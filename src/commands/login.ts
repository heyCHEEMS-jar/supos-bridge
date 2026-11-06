import * as vscode from 'vscode'
import { commands } from '../constants/commands'
import { login } from '../utils/login'

export const registerLogin = (ctx: vscode.ExtensionContext) =>
  vscode.commands.registerCommand(commands.LOGIN, async () => {
    try {
      await login(ctx)
    } catch (e) {
      if (e instanceof vscode.CancellationError) return
      const message = e instanceof Error ? e.message : String(e)
      vscode.window.showErrorMessage(vscode.l10n.t('supOS login failed: {0}', message))
    }
  })
