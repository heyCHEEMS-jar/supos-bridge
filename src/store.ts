// 全局变量缓存

import * as vscode from 'vscode'
import { isAbsolutePath } from './utils/file'

export interface App {
  appId: string
  name: string
}

export interface Component {
  folderName: string
  fullPath: string
  path: string
}

const compFilesKey = 'componentFiles'

const getCompFiles = () => vscode.workspace.getConfiguration().inspect<Record<string, string>>(compFilesKey)?.workspaceValue ?? {}

const saveCompFiles = async (files: Record<string, string>) => {
  await vscode.workspace.getConfiguration().update(compFilesKey, files, vscode.ConfigurationTarget.Workspace)
}

export const store = {
  curApp: undefined as App | undefined,
  curComp: undefined as Component | undefined,
  // 获取组件的uri，持久化存储，{ "{appId}:{folderName}": "absolutePath" }
  getCompFile(app: App, comp: Component) {
    const value = getCompFiles()[`${app.appId}:${comp.folderName}`]
    return value ? (isAbsolutePath(value) ? vscode.Uri.file(value) : vscode.Uri.parse(value)) : undefined
  },
  // compFiles持久存储恢复到当前store实例运行内存中
  async restoreCompFiles(ctx: vscode.ExtensionContext) {
    const saved = ctx.workspaceState.get<Record<string, string>>(compFilesKey)
    if (!saved) return
    await saveCompFiles({ ...saved, ...getCompFiles() })
    await ctx.workspaceState.update(compFilesKey, undefined)
  },
  // 绑定组件与文件映射关系，持久化存储
  async bindCompFile(app: App, comp: Component, uri: vscode.Uri) {
    await saveCompFiles({ ...getCompFiles(), [`${app.appId}:${comp.folderName}`]: uri.fsPath })
  },
  async removeCompFile(app: App, comp: Component) {
    const files = { ...getCompFiles() }
    delete files[`${app.appId}:${comp.folderName}`]
    await saveCompFiles(files)
  }
}
