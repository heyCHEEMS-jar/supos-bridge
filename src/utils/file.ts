import * as vscode from 'vscode'

export const readIfExists = async (uri: vscode.Uri) => {
  try {
    return await vscode.workspace.fs.readFile(uri)
  } catch {
    return undefined
  }
}

export const isSame = (a: Uint8Array | undefined, b: Uint8Array) => !!a && a.length === b.length && a.every((v, i) => v === b[i])

export const writeIfChanged = async (dir: vscode.Uri, fileName: string, content: Uint8Array) => {
  const to = vscode.Uri.joinPath(dir, fileName)
  if (isSame(await readIfExists(to), content)) return false
  await vscode.workspace.fs.createDirectory(dir)
  await vscode.workspace.fs.writeFile(to, content)
  return true
}

export const foldersOrWarn = () => {
  const folders = vscode.workspace.workspaceFolders ?? []
  if (!folders.length) vscode.window.showWarningMessage('请先打开一个文件夹')
  return folders
}
