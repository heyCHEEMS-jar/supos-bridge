import * as assert from 'assert'
import * as os from 'node:os'
import * as vscode from 'vscode'
import { isSame, readIfExists, writeIfChanged } from '../utils/file'

describe('utils/file', () => {
  const dir = vscode.Uri.joinPath(vscode.Uri.file(os.tmpdir()), 'supos-snippets-test')
  const name = 'index.d.ts'
  const content = new TextEncoder().encode('declare const scriptUtil: any')

  beforeEach(async () => {
    try {
      await vscode.workspace.fs.delete(dir, { recursive: true, useTrash: false })
    } catch {}
  })

  it('目录不存在时新建再写入', async () => {
    assert.strictEqual(await writeIfChanged(dir, name, content), true)
    assert.ok(isSame(await readIfExists(vscode.Uri.joinPath(dir, name)), content))
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

describe('extension', () => {
  it('可以被激活', async () => {
    const ext = vscode.extensions.getExtension('heyCHEEMS.supos-snippets')
    assert.ok(ext, '找不到扩展，检查 package.json 里的 publisher 和 name')
    await ext.activate()
    assert.strictEqual(ext.isActive, true)
  })
})
