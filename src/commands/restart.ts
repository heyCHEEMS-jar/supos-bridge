import * as vscode from 'vscode'
import { commands } from '../constants/commands'
import { foldersOrWarn } from '../utils/file'
import { generateAll } from './gen-types'

// 重启扩展
export const registerRestart = (ctx: vscode.ExtensionContext) =>
  vscode.commands.registerCommand(commands.RESTART, async () => {
    const folders = foldersOrWarn()
    if (!folders.length) return
    const wrote = await generateAll(ctx, folders)
    if (wrote === null) return
    await vscode.commands.executeCommand('typescript.restartTsServer')
    vscode.window.showInformationMessage('已重新写入类型声明并重启 TS 服务')
  })
