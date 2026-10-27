import * as vscode from 'vscode'
import { chromium } from 'playwright-core'

export const login = async (ctx: vscode.ExtensionContext) => {
  const config = vscode.workspace.getConfiguration()
  const baseURL = config.get<string>('baseURL', '').trim().replace(/\/+$/, '')
  const loginAPIPath = config.get<string>('loginAPIPath', '/inter-api/auth/login').trim() || '/inter-api/auth/login'
  if (!baseURL) throw new Error(vscode.l10n.t('Please configure {0} first', 'baseURL'))

  const browser = await chromium
    .launch({ channel: 'chrome', headless: false })
    .catch(() => chromium.launch({ channel: 'msedge', headless: false }))
    .catch((e) => {
      const message = e instanceof Error ? e.message : String(e)
      throw new Error(vscode.l10n.t('Could not start Chrome or Edge: {0}', message))
    })
  try {
    const page = await browser.newPage()
    const responsePromise = page.waitForResponse(
      (res) => res.request().method() === 'POST' && new URL(res.url()).pathname.endsWith(loginAPIPath),
      { timeout: 300000 }
    )

    await page.goto(`${baseURL}/login`)
    vscode.window.showInformationMessage(vscode.l10n.t('Complete login in the opened browser'))

    const response = await responsePromise.catch(() => {
      throw new Error(vscode.l10n.t('Browser login was cancelled or timed out'))
    })
    const result = (await response.json()) as { ticket?: unknown }
    if (typeof result.ticket !== 'string' || !result.ticket) {
      throw new Error(vscode.l10n.t('No valid ticket was returned'))
    }

    await ctx.secrets.store('ticket', result.ticket)
    return result.ticket
  } finally {
    await browser.close()
  }
}

export const ensureLogin = async (ctx: vscode.ExtensionContext) => (await ctx.secrets.get('ticket')) ?? login(ctx)
