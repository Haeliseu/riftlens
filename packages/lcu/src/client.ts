import { z } from "zod"

export interface LcuCredentials {
  port: number
  password: string
  protocol: "https"
}

export function buildLcuUrl(credentials: LcuCredentials, path: string): string {
  return `${credentials.protocol}://127.0.0.1:${credentials.port}${path}`
}

export function parseLcuArgs(args: string): LcuCredentials | null {
  const portMatch = /--app-port=(\d+)/.exec(args)
  const tokenMatch = /--remoting-auth-token=([\w-]+)/.exec(args)

  if (!portMatch?.[1] || !tokenMatch?.[1]) return null

  return {
    port: parseInt(portMatch[1], 10),
    password: tokenMatch[1],
    protocol: "https",
  }
}

export class LcuClient {
  private readonly authHeader: string

  constructor(private readonly credentials: LcuCredentials) {
    this.authHeader = `Basic ${Buffer.from(`riot:${credentials.password}`).toString("base64")}`
  }

  async get<T>(path: string, schema: z.ZodType<T>): Promise<T> {
    const url = buildLcuUrl(this.credentials, path)
    const res = await globalThis.fetch(url, {
      headers: { Authorization: this.authHeader },
    })
    if (!res.ok) {
      throw new Error(`LCU request failed: ${res.status} ${path}`)
    }
    return schema.parse(await res.json())
  }

  async post<T>(path: string, body: unknown, schema: z.ZodType<T>): Promise<T> {
    const url = buildLcuUrl(this.credentials, path)
    const res = await globalThis.fetch(url, {
      method: "POST",
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      throw new Error(`LCU POST failed: ${res.status} ${path}`)
    }
    return schema.parse(await res.json())
  }

  async delete(path: string): Promise<void> {
    const url = buildLcuUrl(this.credentials, path)
    const res = await globalThis.fetch(url, {
      method: "DELETE",
      headers: { Authorization: this.authHeader },
    })
    if (!res.ok) {
      throw new Error(`LCU DELETE failed: ${res.status} ${path}`)
    }
  }
}
