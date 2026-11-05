import * as vscode from 'vscode'
import { commands } from '../constants/commands'
import { store } from '../store'
import { loadApps } from '../utils/apps'
import { runWithProgress } from '../utils/progress'

export const registerSelectApp = (ctx: vscode.ExtensionContext) =>
  vscode.commands.registerCommand(commands.SELECT_APP, async () => {
    const apps = await runWithProgress(vscode.l10n.t('Fetching apps'), () => loadApps(ctx))
    const selected = await vscode.window.showQuickPick(
      apps.map((app) => ({ label: app.name, description: app.appId, app })),
      { placeHolder: vscode.l10n.t('Select App') }
    )

    if (selected) {
      if (store.curApp?.appId !== selected.app.appId) store.curComp = undefined
      store.curApp = { ...selected.app }
      vscode.window.showInformationMessage(vscode.l10n.t('{0} selected', store.curApp.name))
    }
  })
