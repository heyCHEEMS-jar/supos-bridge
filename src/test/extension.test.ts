import * as assert from 'assert'
import * as os from 'node:os'
import * as vscode from 'vscode'
import { store } from '../store'
import { equalFile, readIfExists, writeIfChanged } from '../utils/file'

// 文件工具
describe('utils/file', () => {
  const dir = vscode.Uri.joinPath(vscode.Uri.file(os.tmpdir()), 'supos-bridge-test')
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
describe('store/componentFiles', () => {
  const app = { appId: 'App_test', name: 'Test' }
  const comp = { folderName: 'Component_test', fullPath: '/extensions/Component_test', path: '/extensions' }
  const uri = vscode.Uri.file('C:/components/Component_test.js')

  const createContext = () => {
    const values = new Map<string, unknown>()
    const ctx = Object.create(null)
    Object.defineProperty(ctx, 'workspaceState', {
      value: {
        keys: () => [...values.keys()],
        get: (key: string, defaultValue: unknown) => values.get(key) ?? defaultValue,
        update: async (key: string, value: unknown) => void values.set(key, value)
      }
    })
    return { ctx, values }
  }

  beforeEach(() => store.compFiles.clear())
  after(() => store.compFiles.clear())

  it('绑定后写入内存和工作区状态', async () => {
    const { ctx, values } = createContext()
    await store.bindCompFile(ctx, app, comp, uri)

    assert.strictEqual(store.getCompFile(app, comp)?.toString(), uri.toString())
    assert.deepStrictEqual(values.get('componentFiles'), { 'App_test:Component_test': uri.toString() })
  })

  it('从工作区状态恢复绑定', () => {
    const { ctx, values } = createContext()
    values.set('componentFiles', { 'App_test:Component_test': uri.toString() })
    store.restoreCompFiles(ctx)

    assert.strictEqual(store.getCompFile(app, comp)?.toString(), uri.toString())
  })

  it('删除绑定后同步工作区状态', async () => {
    const { ctx, values } = createContext()
    await store.bindCompFile(ctx, app, comp, uri)
    await store.removeCompFile(ctx, app, comp)

    assert.strictEqual(store.getCompFile(app, comp), undefined)
    assert.deepStrictEqual(values.get('componentFiles'), {})
  })
})

// 扩展激活
describe('extension', () => {
  it('可以被激活', async () => {
    const ext = vscode.extensions.getExtension('heyCHEEMS.supos-bridge')
    assert.ok(ext, '找不到扩展，检查 package.json 里的 publisher 和 name')
    await ext.activate()
    assert.strictEqual(ext.isActive, true)
  })
})
