// 全局变量缓存

import * as vscode from 'vscode'

export interface App {
  appId: string
  name: string
}

export interface Component {
  folderName: string
  fullPath: string
  path: string
}

export const store = {
  curApp: undefined as App | undefined,
  curComp: undefined as Component | undefined,
  compFiles: new Map<string, vscode.Uri>(), // 持久化存储，{ "{appId}:{folderName}": "uri" }
  // 获取组件的uri
  getCompFile(app: App, comp: Component) {
    return this.compFiles.get(`${app.appId}:${comp.folderName}`)
  },
  // compFiles持久存储恢复到当前store实例运行内存中
  restoreCompFiles(ctx: vscode.ExtensionContext) {
    const files = ctx.workspaceState.get<Record<string, string>>('componentFiles', {})
    for (const [key, uri] of Object.entries(files)) this.compFiles.set(key, vscode.Uri.parse(uri))
  },
  // 绑定组件与文件uri映射关系，持久化存储
  async bindCompFile(ctx: vscode.ExtensionContext, app: App, comp: Component, uri: vscode.Uri) {
    this.compFiles.set(`${app.appId}:${comp.folderName}`, uri)
    await this.saveCompFiles(ctx)
  },
  async saveCompFiles(ctx: vscode.ExtensionContext) {
    const files: Record<string, string> = {}
    for (const [key, value] of this.compFiles) files[key] = value.toString()
    await ctx.workspaceState.update('componentFiles', files)
  },
  async removeCompFile(ctx: vscode.ExtensionContext, app: App, comp: Component) {
    this.compFiles.delete(`${app.appId}:${comp.folderName}`)
    await this.saveCompFiles(ctx)
  }
}
