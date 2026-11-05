import * as vscode from 'vscode'
import { commands } from '../constants/commands'
import { store } from '../store'
import { fetchComponents, getComponentFile } from '../utils/component'

export const registerSelectComponent = (ctx: vscode.ExtensionContext) =>
  vscode.commands.registerCommand(commands.SELECT_COMPONENT, async () => {
    if (!store.curApp) await vscode.commands.executeCommand(commands.SELECT_APP)
    if (!store.curApp) return

    const components = await fetchComponents(ctx, store.curApp)

    const selected = await vscode.window.showQuickPick(
      components.map((comp) => ({ label: comp.folderName, description: comp.path, comp })),
      { placeHolder: vscode.l10n.t('Select Programmable Component') }
    )
    if (!selected) return

    const uri = await getComponentFile(ctx, store.curApp, selected.comp)
    if (!uri) return
    await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uri))
    store.curComp = { ...selected.comp }
    vscode.window.showInformationMessage(vscode.l10n.t('Selected component {0}', store.curComp.folderName))
  })
