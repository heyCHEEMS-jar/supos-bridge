import * as vscode from 'vscode'
import { commands } from '../constants/commands'
import { foldersOrWarn } from '../utils/file'
import { ensureLogin } from '../utils/login'
import { generateAll } from './gen-types'

// 重启扩展
export const registerRestart = (ctx: vscode.ExtensionContext) =>
  vscode.commands.registerCommand(commands.RESTART, async () => {
    try {
      await ensureLogin(ctx)
    } catch (e) {
      if (e instanceof vscode.CancellationError) return
      const message = e instanceof Error ? e.message : String(e)
      vscode.window.showErrorMessage(vscode.l10n.t('SupOS login failed: {0}', message))
      return
    }

    const folders = foldersOrWarn()
    if (!folders.length) return
    const wrote = await generateAll(ctx, folders)
    if (wrote === null) return
    await vscode.commands.executeCommand('typescript.restartTsServer')
    vscode.window.showInformationMessage(vscode.l10n.t('Type hints reloaded'))
  })
