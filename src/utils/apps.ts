import * as vscode from 'vscode'
import { store } from '../store'
import { request } from './request'

export const loadApps = async (ctx: vscode.ExtensionContext, { autoLogin = true }: { autoLogin?: boolean } = {}) => {
  const config = vscode.workspace.getConfiguration()
  const baseURL = config.get<string>('baseURL')
  const apiPath = config.get<string>('applicationMgrAPIPath')
  const { list } = (await request(ctx, { url: `${baseURL}${apiPath}`, autoLogin })) as { list: typeof store.apps }
  store.apps = list.map(({ appId, name }) => ({ appId, name }))
}
