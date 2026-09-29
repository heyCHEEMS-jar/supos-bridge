import * as vscode from 'vscode'
import { commands } from '../constants/commands'
import { filePaths } from '../constants/file-paths'
import { foldersOrWarn, writeIfChanged } from '../utils/file'

// supos.d.ts 类型文件写到 node_modules/@types/supos 下
export const generateTypes = async (ctx: vscode.ExtensionContext, folder: vscode.WorkspaceFolder) => {
  const from = vscode.Uri.joinPath(ctx.extensionUri, filePaths.TYPES_SOURCE)
  const dir = vscode.Uri.joinPath(folder.uri, filePaths.TYPES_DIR)
  return writeIfChanged(dir, filePaths.TYPES_ENTRY, await vscode.workspace.fs.readFile(from))
}

export const generateAll = async (ctx: vscode.ExtensionContext, folders: readonly vscode.WorkspaceFolder[]) => {
  try {
    let wrote = false
    for (const folder of folders) if (await generateTypes(ctx, folder)) wrote = true
    return wrote
  } catch (e) {
    vscode.window.showErrorMessage(`写入 ${filePaths.TYPES_DIR}/${filePaths.TYPES_ENTRY} 失败：${e}`)
    return null
  }
}

// 生成.d.ts
export const registerGenerateTypes = (ctx: vscode.ExtensionContext) =>
  vscode.commands.registerCommand(commands.GENERATE_TYPES, async () => {
    const folders = foldersOrWarn()
    if (!folders.length) return
    const wrote = await generateAll(ctx, folders)
    if (wrote === null) return
    if (wrote) await vscode.commands.executeCommand('typescript.restartTsServer')
    vscode.window.showInformationMessage(wrote ? `已写入 ${filePaths.TYPES_DIR}/${filePaths.TYPES_ENTRY}` : '类型声明已是最新')
  })
