import * as vscode from 'vscode'
import { commands } from '../constants/commands'
import { store } from '../store'
import { runWithProgress } from '../utils/progress'
import { request } from '../utils/request'

export const registerSelectComponent = (ctx: vscode.ExtensionContext) =>
  vscode.commands.registerCommand(commands.SELECT_COMPONENT, async () => {
    if (!store.curApp) await vscode.commands.executeCommand(commands.SELECT_APP)
    if (!store.curApp) return

    const config = vscode.workspace.getConfiguration()
    const baseURL = config.get<string>('baseURL')
    const apiPath = config.get<string>('componentFolderAPIPath')
    const apiParams = config.get<string>('componentFolderAPIParams')
    const url = `${baseURL}${apiPath}${apiParams}${encodeURIComponent(store.curApp.appId)}`
    const { folderInfoList } = (await runWithProgress(vscode.l10n.t('Fetching programmable components'), () => request.get(ctx, url))) as {
      folderInfoList: typeof store.comps
    }
    store.comps = folderInfoList.map(({ folderName, fullPath, path }) => ({ folderName, fullPath, path }))

    const selected = await vscode.window.showQuickPick(
      store.comps.map((comp) => ({ label: comp.folderName, description: comp.path, comp })),
      { placeHolder: vscode.l10n.t('Select Programmable Component') }
    )
    if (!selected) return
    store.curComp = { ...selected.comp }
    vscode.window.showInformationMessage(vscode.l10n.t('{0} selected', selected.comp.folderName))
  })
