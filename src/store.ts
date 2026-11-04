// 全局变量缓存

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
  apps: [] as App[],
  curApp: undefined as App | undefined,
  comps: [] as Component[],
  curComp: undefined as Component | undefined
}
