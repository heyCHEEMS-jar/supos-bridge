import * as vscode from 'vscode'
import type { App, Component } from '../store'
import { store } from '../store'
import { readIfExists } from './file'
import { runWithProgress } from './progress'
import { request } from './request'

interface ComponentListResponse {
  folderInfoList: Component[]
}

interface UploadedResource {
  fullPath: string
  filePath: string
}

const getSelectedComponent = () => {
  const { curApp, curComp } = store
  if (!curApp || !curComp) throw new Error(vscode.l10n.t('Please select a programmable component first'))
  return { curApp, curComp }
}

export const getComponentFile = async (ctx: vscode.ExtensionContext, app: App, comp: Component) => {
  const uri = store.getCompFile(app, comp)
  if (!uri) {
    if (store.curApp?.appId === app.appId && store.curComp?.folderName === comp.folderName) store.curComp = undefined
    vscode.window.showWarningMessage(vscode.l10n.t('Please pull the programmable component first'))
    return
  }
  if (await readIfExists(uri)) return uri

  await store.removeCompFile(ctx, app, comp)
  if (store.curApp?.appId === app.appId && store.curComp?.folderName === comp.folderName) store.curComp = undefined
  vscode.window.showWarningMessage(vscode.l10n.t('Component file does not exist. Please pull it again'))
  return undefined
}

export const fetchComponents = async (ctx: vscode.ExtensionContext, app: App) => {
  const config = vscode.workspace.getConfiguration()
  const baseURL = config.get<string>('baseURL')
  const apiPath = config.get<string>('componentFolderAPIPath')
  const mgrPath = config.get<string>('programmableComponentMgrPath')
  const url = new URL(`${baseURL}${apiPath}`)
  url.searchParams.set('path', mgrPath ?? '')
  url.searchParams.set('appId', app.appId)
  const { folderInfoList }: ComponentListResponse = await runWithProgress(vscode.l10n.t('Fetching programmable components'), () =>
    request.get(ctx, url.href)
  )
  return folderInfoList.map(({ folderName, fullPath, path }) => ({ folderName, fullPath, path }))
}

const uploadCode = (ctx: vscode.ExtensionContext, file: File, type: 'compiled' | 'source') => {
  const { curApp, curComp } = getSelectedComponent()
  const config = vscode.workspace.getConfiguration()
  const baseURL = config.get<string>('baseURL')
  const apiPath = config.get<string>('uploadResourceAPIPath')
  const mgrPath = config.get<string>('programmableComponentMgrPath')
  const codePath = config.get<string>(type === 'compiled' ? 'componentCompiledCodePath' : 'componentSourceCodePath')
  const form = new FormData()
  form.append('appId', curApp.appId)
  form.append('path', `${mgrPath}/${curComp.folderName}${codePath}`)
  form.append('file', file)
  return request(ctx, { url: `${baseURL}${apiPath}`, method: 'POST', body: form }) as Promise<UploadedResource>
}

// 上传编译后的源码
export const uploadCompiledCode = (ctx: vscode.ExtensionContext, file: File) => uploadCode(ctx, file, 'compiled')

// 上传原代码
export const uploadSourceCode = (ctx: vscode.ExtensionContext, file: File) => uploadCode(ctx, file, 'source')

// 拉取原代码
export const fetchSourceCode = (ctx: vscode.ExtensionContext, curApp: App, curComp: Component) => {
  const config = vscode.workspace.getConfiguration()
  const baseURL = config.get<string>('baseURL')
  const apiPath = config.get<string>('resourceAPIPath')
  const mgrPath = config.get<string>('programmableComponentMgrPath')
  const sourcePath = config.get<string>('componentSourceCodePath')
  const fileName = config.get<string>('componentCodeFileName')
  const appId = encodeURIComponent(curApp.appId)
  const folderName = encodeURIComponent(curComp.folderName)
  return request(ctx, {
    url: `${baseURL}${apiPath}/${appId}${mgrPath}/${folderName}${sourcePath}/${fileName}`,
    responseType: 'text'
  }) as Promise<string>
}
