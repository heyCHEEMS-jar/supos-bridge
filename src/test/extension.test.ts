import * as assert from 'assert'
import * as os from 'node:os'
import * as vscode from 'vscode'
import { watchSelectedComponent } from '../auto-push-component'
import { store } from '../store'
import { equalFile, readIfExists, writeIfChanged } from '../utils/file'

// 文件工具
describe('utils/file', () => {
  const dir = vscode.Uri.joinPath(vscode.Uri.file(os.tmpdir()), 'supos-devtools-test')
  const name = 'index.d.ts'
  const content = new TextEncoder().encode('declare const scriptUtil: any')

  const cleanup = async () => {
    try {
      await vscode.workspace.fs.delete(dir, { recursive: true, useTrash: false })
    } catch {}
  }

  beforeEach(cleanup)
  after(cleanup)

  it('目录不存在时新建再写入', async () => {
    assert.strictEqual(await writeIfChanged(dir, name, content), true)
    assert.ok(equalFile(await readIfExists(vscode.Uri.joinPath(dir, name)), content))
  })

  it('内容一致时不重写', async () => {
    await writeIfChanged(dir, name, content)
    assert.strictEqual(await writeIfChanged(dir, name, content), false)
  })

  it('内容变化时覆盖', async () => {
    await writeIfChanged(dir, name, content)
    const next = new TextEncoder().encode('declare const scriptUtil: number')
    assert.strictEqual(await writeIfChanged(dir, name, next), true)
  })

  it('读不到时返回 undefined', async () => {
    assert.strictEqual(await readIfExists(vscode.Uri.joinPath(dir, 'missing.d.ts')), undefined)
  })
})

// 组件文件绑定
describe('store/compFiles', () => {
  const key = 'componentFiles'
  const app = { appId: 'App_test', name: 'Test' }
  const comp = { folderName: 'Component_test', fullPath: '/extensions/Component_test', path: '/extensions' }
  const uri = vscode.Uri.file('C:/components/Component_test.js')
  const config = () => vscode.workspace.getConfiguration()

  const clearConfig = async () => {
    if (config().inspect<Record<string, string>>(key)?.workspaceValue !== undefined)
      await config().update(key, undefined, vscode.ConfigurationTarget.Workspace)
    await config().update(key, undefined, vscode.ConfigurationTarget.Global)
  }

  const createContext = () => {
    const values = new Map<string, unknown>()
    const ctx = Object.create(null)
    Object.defineProperty(ctx, 'workspaceState', {
      value: {
        keys: () => [...values.keys()],
        get: (key: string, defaultValue: unknown) => values.get(key) ?? defaultValue,
        update: async (key: string, value: unknown) => {
          if (value === undefined) values.delete(key)
          else values.set(key, value)
        }
      }
    })
    return { ctx, values }
  }

  beforeEach(clearConfig)
  after(clearConfig)

  it('绑定后写入工作区配置', async () => {
    await store.bindCompFile(app, comp, uri)

    assert.strictEqual(store.getCompFile(app, comp)?.toString(), uri.toString())
    assert.deepStrictEqual(config().inspect<Record<string, string>>(key)?.workspaceValue, {
      'App_test:Component_test': uri.fsPath
    })
  })

  it('不读取全局配置中的绑定', async () => {
    await config().update(key, { 'App_test:Component_test': uri.toString() }, vscode.ConfigurationTarget.Global)

    assert.strictEqual(store.getCompFile(app, comp), undefined)
  })

  it('迁移工作区状态中的旧绑定', async () => {
    const { ctx, values } = createContext()
    values.set(key, { 'App_test:Component_test': uri.toString() })
    await store.restoreCompFiles(ctx)

    assert.strictEqual(store.getCompFile(app, comp)?.toString(), uri.toString())
    assert.strictEqual(values.has(key), false)
  })

  it('删除绑定后同步配置', async () => {
    await store.bindCompFile(app, comp, uri)
    await store.removeCompFile(app, comp)

    assert.strictEqual(store.getCompFile(app, comp), undefined)
    assert.deepStrictEqual(config().inspect<Record<string, string>>(key)?.workspaceValue, {})
  })
})

// 自动推送组件
 describe('autoPushComponent', () => {
  const key = 'autoPushComponentOnChange'
  const config = () => vscode.workspace.getConfiguration()

  after(async () => config().update(key, undefined, vscode.ConfigurationTarget.Global))

  it('根据配置决定是否注册监听', async () => {
    const disabledCtx = Object.assign(Object.create(null), { subscriptions: [] })
    await config().update(key, false, vscode.ConfigurationTarget.Global)
    watchSelectedComponent(disabledCtx)
    assert.strictEqual(disabledCtx.subscriptions.length, 0)

    const enabledCtx = Object.assign(Object.create(null), { subscriptions: [] })
    await config().update(key, true, vscode.ConfigurationTarget.Global)
    watchSelectedComponent(enabledCtx)
    assert.strictEqual(enabledCtx.subscriptions.length, 1)
    enabledCtx.subscriptions[0].dispose()
  })
})

// 扩展激活
describe('extension', () => {
  it('可以被激活', async () => {
    const ext = vscode.extensions.getExtension('heyCHEEMS.supos-devtools')
    assert.ok(ext, '找不到扩展，检查 package.json 里的 publisher 和 name')
    await ext.activate()
    assert.strictEqual(ext.isActive, true)
  })
})
