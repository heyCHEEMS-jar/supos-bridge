import * as vscode from 'vscode'

export const readIfExists = async (uri: vscode.Uri) => {
  try {
    return await vscode.workspace.fs.readFile(uri)
  } catch {
    return undefined
  }
}

export const equalFile = (a: Uint8Array | undefined, b: Uint8Array) => !!a && a.length === b.length && a.every((v, i) => v === b[i])

export const writeIfChanged = async (dir: vscode.Uri, fileName: string, content: Uint8Array) => {
  const to = vscode.Uri.joinPath(dir, fileName)
  if (equalFile(await readIfExists(to), content)) return false
  await vscode.workspace.fs.createDirectory(dir)
  await vscode.workspace.fs.writeFile(to, content)
  return true
}

export const foldersOrWarn = () => {
  const folders = vscode.workspace.workspaceFolders ?? []
  if (!folders.length) vscode.window.showWarningMessage(vscode.l10n.t('Please open a folder first'))
  return folders
}
