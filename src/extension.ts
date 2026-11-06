import * as vscode from 'vscode'
import { watchSelectedComponent } from './auto-push-component'
import { store } from './store'

export const activate = async (ctx: vscode.ExtensionContext) => {
  // 无需登录模块
  try {
    const [{ generateAll, registerGenerateTypes }, { registerRestart }] = await Promise.all([
      import('./commands/gen-types.js'),
      import('./commands/restart.js')
    ])
    ctx.subscriptions.push(registerGenerateTypes(ctx), registerRestart(ctx))

    const folders = vscode.workspace.workspaceFolders ?? []
    if (folders.length && (await generateAll(ctx, folders))) await vscode.commands.executeCommand('typescript.restartTsServer')
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    vscode.window.showErrorMessage(vscode.l10n.t('Startup failed: {0}', message))
  }

  // 需要登录的远程模块
  try {
    const [{ registerLogin }, { registerPullComponent }, { registerSelectApp }, { registerSelectComponent }, { registerPushComponent }] =
      await Promise.all([
        import('./commands/login.js'),
        import('./commands/pull-component.js'),
        import('./commands/select-app.js'),
        import('./commands/select-component.js'),
        import('./commands/push-component.js')
      ])
    await store.restoreCompFiles(ctx)
    ctx.subscriptions.push(
      // 监听“自动同步组件”选项，即时开启/清理监听器
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('autoPushComponentOnChange') && store.curComp) watchSelectedComponent(ctx)
      }),
      registerLogin(ctx),
      registerSelectApp(ctx),
      registerSelectComponent(ctx),
      registerPullComponent(ctx),
      registerPushComponent(ctx)
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    vscode.window.showErrorMessage(vscode.l10n.t('Startup failed: {0}', message))
  }
}

export const deactivate = () => {}
