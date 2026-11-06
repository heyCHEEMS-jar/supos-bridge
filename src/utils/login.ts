import * as vscode from 'vscode'
import { chromium, type Browser } from 'playwright-core'

export const login = async (ctx: vscode.ExtensionContext) => {
  const config = vscode.workspace.getConfiguration()
  let baseURL = config.get<string>('baseURL', '').trim().replace(/\/+$/, '')
  const pagePath = config.get<string>('loginPagePath', '/login').trim()
  const apiPath = config.get<string>('loginAPIPath', '/').trim()
  if (!baseURL) {
    baseURL =
      (await vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: vscode.l10n.t(vscode.l10n.t('Please configure {0} first', 'baseURL'))
      })) || ''
  }

  if (baseURL) {
    config.update('baseURL', baseURL)
  } else {
    throw new Error(vscode.l10n.t('Please configure {0} first', 'baseURL'))
  }

  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: vscode.l10n.t('Complete login in the opened browser'),
      cancellable: true
    },
    async (_progress, token) => {
      let browser: Browser | undefined
      let cancellation: vscode.Disposable | undefined
      try {
        if (token.isCancellationRequested) throw new vscode.CancellationError()
        browser = await chromium
          .launch({ channel: 'chrome', headless: false })
          .catch(() => chromium.launch({ channel: 'msedge', headless: false }))
          .catch((e) => {
            throw new Error(vscode.l10n.t('Could not start Chrome or Edge: {0}', e instanceof Error ? e.message : String(e)))
          })
        cancellation = token.onCancellationRequested(() => void browser?.close().catch(() => {}))
        if (token.isCancellationRequested) throw new vscode.CancellationError()

        const page = await browser.newPage({ ignoreHTTPSErrors: true })
        const responsePromise = page.waitForResponse(
          async (res) => {
            if (res.request().method() !== 'POST' || !new URL(res.url()).pathname.endsWith(apiPath) || !res.ok()) return false
            const result: { ticket?: unknown } | null = await res.json().catch(() => null)
            return typeof result?.ticket === 'string' && !!result.ticket.trim()
          },
          { timeout: 0 }
        )

        const [res] = await Promise.all([responsePromise, page.goto(`${baseURL}${pagePath}`)])
        const { ticket } = (await res.json()) as { ticket: string }
        if (token.isCancellationRequested) throw new vscode.CancellationError()
        await ctx.secrets.store('ticket', ticket)
        return ticket
      } catch (e) {
        if (token.isCancellationRequested || (browser && !browser.isConnected())) throw new vscode.CancellationError()
        throw e
      } finally {
        cancellation?.dispose()
        await browser?.close()
      }
    }
  )
}
