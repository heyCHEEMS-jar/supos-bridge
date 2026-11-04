import * as vscode from 'vscode'
import { commands } from '../constants/commands'
import { store } from '../store'
import { loadApps } from '../utils/apps'
import { runWithProgress } from '../utils/progress'

const getItems = () => store.apps.map((app) => ({ label: app.name, description: app.appId, app }))

export const registerSelectApp = (ctx: vscode.ExtensionContext) =>
  vscode.commands.registerCommand(commands.SELECT_APP, async () => {
    const picker = vscode.window.createQuickPick<ReturnType<typeof getItems>[number]>()
    picker.placeholder = vscode.l10n.t('Select App')
    picker.items = getItems()
    picker.show()

    let closed = false
    void runWithProgress(vscode.l10n.t('Fetching apps'), () => loadApps(ctx))
      .then(() => {
        if (!closed) picker.items = getItems()
      })
      .catch(() => {})

    const selected = await new Promise<ReturnType<typeof getItems>[number] | undefined>((resolve) => {
      picker.onDidAccept(() => {
        resolve(picker.selectedItems[0])
        picker.hide()
      })
      picker.onDidHide(() => resolve(undefined))
    })
    closed = true
    picker.dispose()

    if (selected) {
      store.curApp = { ...selected.app }
      vscode.window.showInformationMessage(vscode.l10n.t('{0} selected', store.curApp.name))
    }
  })
