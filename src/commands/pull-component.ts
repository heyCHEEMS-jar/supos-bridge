import * as vscode from 'vscode'
import { watchSelectedComponent } from '../auto-push-component'
import { commands } from '../constants/commands'
import { store } from '../store'
import { fetchComps, fetchSourceCode } from '../utils/component'
import { pickSaveFolder, readIfExists } from '../utils/file'
import { runWithProgress } from '../utils/progress'

const savePathKey = 'componentCodeLocalPath'

export const registerPullComponent = (ctx: vscode.ExtensionContext) =>
  vscode.commands.registerCommand(commands.PULL_COMPONENT, async () => {
    if (!store.curApp) await vscode.commands.executeCommand(commands.SELECT_APP)
    const { curApp } = store
    if (!curApp) return

    const comps = await fetchComps(ctx, curApp)

    const selected = await vscode.window.showQuickPick(
      comps.map((comp) => ({ label: comp.folderName, description: comp.path, comp })),
      { placeHolder: vscode.l10n.t('Select Programmable Component') }
    )
    if (!selected) return
    const curComp = selected.comp

    const folder = await pickSaveFolder(savePathKey)
    if (!folder) return

    const fileName = `${curComp.folderName}.js`
    const uri = vscode.Uri.joinPath(folder, fileName)
    if (await readIfExists(uri)) {
      const overwrite = vscode.l10n.t('Overwrite')
      if (
        (await vscode.window.showWarningMessage(vscode.l10n.t('{0} already exists. Overwrite it?', fileName), { modal: true }, overwrite)) !== overwrite
      )
        return
    }

    const code = await runWithProgress(vscode.l10n.t('Fetching component source code'), () => fetchSourceCode(ctx, curApp, curComp))
    await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(code))
    await store.bindCompFile(curApp, curComp, uri)
    await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uri))
    store.curComp = { ...curComp }
    watchSelectedComponent(ctx)
    vscode.window.showInformationMessage(vscode.l10n.t('Pulled component {0}', curComp.folderName))
  })
