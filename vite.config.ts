import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Lokal inkişafda /api/ai-report ünvanını Vercel Function ilə eyni kodla xidmətə verir
 * (server/aiReport.ts). Açarlar .env-dən yalnız serverdə oxunur.
 */
function devApi(): Plugin {
  return {
    name: 'learnly-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/ai-report', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end()
          return
        }
        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)
        let body: unknown = {}
        try {
          body = JSON.parse(Buffer.concat(chunks).toString() || '{}')
        } catch {
          /* boş body */
        }
        try {
          const mod = (await server.ssrLoadModule('/server/aiReport.ts')) as typeof import('./server/aiReport')
          const env = mod.envFrom({ ...loadEnv('development', process.cwd(), ''), ...process.env })
          const out = await mod.handleAiReport(req.headers.authorization, body, env)
          res.statusCode = out.status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(out.json))
        } catch (e) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: e instanceof Error ? e.message : 'internal_error' }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devApi()],
})
