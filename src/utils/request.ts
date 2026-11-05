import * as vscode from 'vscode'
import { login } from './login'

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  timeout?: number
  headers?: Headers
  body?: any
  autoLogin?: boolean
  responseType?: 'json' | 'text'
}

export class TicketExpiredError extends Error {}

const ctrls = new Set<AbortController>()

export const request = async (ctx: vscode.ExtensionContext, options: RequestOptions) => {
  const { url, method = 'GET', timeout = 15000, body = null, autoLogin = true, responseType = 'json' } = options
  const headers = new Headers(options.headers)
  const json = body !== null && (Object.getPrototypeOf(body) === Object.prototype || Array.isArray(body)) // 排除Date/RegExp等
  if (json && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  const ctrl = new AbortController()
  ctrls.add(ctrl)
  const send = (ticket: string) => {
    headers.set('Authorization', `Bearer ${ticket}`)
    return fetch(url, {
      method,
      headers,
      body: json ? JSON.stringify(body) : body,
      signal: timeout > 0 ? AbortSignal.any([ctrl.signal, AbortSignal.timeout(timeout)]) : ctrl.signal
    })
  }

  try {
    let ticket = await ctx.secrets.get('ticket')
    const loggedIn = !ticket
    if (!ticket) {
      if (!autoLogin) throw new TicketExpiredError()
      ticket = await login(ctx)
    }

    let res = await send(ticket)
    if (res.status === 401) {
      await ctx.secrets.delete('ticket')
      if (!autoLogin) throw new TicketExpiredError()
      if (!loggedIn) {
        ticket = await login(ctx)
        res = await send(ticket)
        if (res.status === 401) await ctx.secrets.delete('ticket')
      }
    }

    if (!res.ok) throw new Error(vscode.l10n.t('Request failed: HTTP {0}', res.status))
    return responseType === 'text' ? await res.text() : await res.json()
  } finally {
    ctrls.delete(ctrl)
  }
}

request.get = (ctx: vscode.ExtensionContext, url: string, timeout?: number) => request(ctx, { url, method: 'GET', timeout })
request.post = (ctx: vscode.ExtensionContext, url: string, timeout?: number) => request(ctx, { url, method: 'POST', timeout })
request.put = (ctx: vscode.ExtensionContext, url: string, timeout?: number) => request(ctx, { url, method: 'PUT', timeout })
request.delete = (ctx: vscode.ExtensionContext, url: string, timeout?: number) => request(ctx, { url, method: 'DELETE', timeout })
request.cancel = () => ctrls.forEach((ctrl) => ctrl.abort())
