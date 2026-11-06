import * as vscode from 'vscode'
import { commands } from './constants/commands'
import { store } from './store'

let listener: vscode.Disposable | undefined

const stop = () => {
  listener?.dispose()
  listener = undefined
}

export const watchSelectedComponent = (ctx: vscode.ExtensionContext) => {
  stop()
  if (!vscode.workspace.getConfiguration().get('autoPushComponentOnChange', true)) return

  let throttled = false
  listener = vscode.workspace.onDidSaveTextDocument(async (document) => {
    const { curApp, curComp } = store
    const uri = curApp && curComp && store.getCompFile(curApp, curComp)
    if (!uri) return stop()
    if (document.uri.toString() !== uri.toString() || throttled) return

    throttled = true
    setTimeout(() => (throttled = false), 2000)
    try {
      await vscode.commands.executeCommand(commands.PUSH_COMPONENT)
    } catch {
      stop()
    }
  })
  ctx.subscriptions.push(listener)
}
