import * as path from 'node:path'
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

export const pickSaveFolder = async (key: string) => {
  const folders = foldersOrWarn()
  if (!folders.length) return

  const config = vscode.workspace.getConfiguration()
  const saved = config.inspect<string>(key)?.workspaceValue
  // 使用 windows 路径或 UNC 额外校验绝对路径，阻止windows上使用“/”开头的路径，必须使用盘符开头的绝对路径
  const absolute = saved && path.isAbsolute(saved) && (process.platform !== 'win32' || /^[a-zA-Z]:[\\/]|^\\\\/.test(saved))
  if (absolute) return vscode.Uri.file(saved)

  const custom = vscode.l10n.t('Custom location')
  const items: { label: string; description?: string; folder?: vscode.Uri; remember: boolean }[] = folders.flatMap((folder) => [
    { label: folder.name, description: folder.uri.fsPath, folder: folder.uri, remember: false },
    { label: vscode.l10n.t('{0} (Remember this option)', folder.name), description: folder.uri.fsPath, folder: folder.uri, remember: true }
  ])
  items.push({ label: custom, remember: false }, { label: vscode.l10n.t('{0} (Remember this option)', custom), remember: true })

  const selected = await vscode.window.showQuickPick(items, { placeHolder: vscode.l10n.t('Select workspace for component file') })
  if (!selected) return

  const folder = selected.folder ?? (await vscode.window.showOpenDialog({ canSelectFiles: false, canSelectFolders: true, canSelectMany: false }))?.[0]
  if (folder && selected.remember) await config.update(key, folder.fsPath, vscode.ConfigurationTarget.Workspace)
  return folder
}
