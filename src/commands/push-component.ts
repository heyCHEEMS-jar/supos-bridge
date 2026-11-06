import * as vscode from 'vscode'
import { commands } from '../constants/commands'
import { store } from '../store'
import { compileComponent } from '../utils/compile'
import { fetchSourceCode, getCompFile, uploadCompiledCode, uploadSourceCode } from '../utils/component'
import { backupCompFile } from '../utils/file'
import { runWithProgress } from '../utils/progress'

export const registerPushComponent = (ctx: vscode.ExtensionContext) =>
  vscode.commands.registerCommand(commands.PUSH_COMPONENT, async () => {
    if (!store.curApp) await vscode.commands.executeCommand(commands.SELECT_APP)
    if (!store.curApp) return
    if (!store.curComp) await vscode.commands.executeCommand(commands.SELECT_COMPONENT)
    const { curApp, curComp } = store
    if (!curComp) return

    const uri = await getCompFile(curApp, curComp)
    if (!uri) return

    const document = await vscode.workspace.openTextDocument(uri)
    await vscode.window.showTextDocument(document)
    const fileName = vscode.workspace.getConfiguration().get('componentCodeFileName', 'index.js')
    const code = document.getText()

    await runWithProgress(vscode.l10n.t('Synchronizing component {0}', curComp.folderName), async () => {
      const compiled = await compileComponent(code, document.fileName, document.languageId)
      await backupCompFile(uri, await fetchSourceCode(ctx, curApp, curComp))
      await uploadSourceCode(ctx, new File([code], fileName, { type: 'text/javascript' }))
      await uploadCompiledCode(ctx, new File([compiled], fileName, { type: 'text/javascript' }))
    })
    vscode.window.showInformationMessage(vscode.l10n.t('Synchronized component {0}', curComp.folderName))
  })
