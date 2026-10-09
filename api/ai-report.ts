// Vercel Function: POST /api/ai-report
// Server mühit dəyişənləri (Vercel → Settings → Environment Variables):
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY
// VITE_ prefiksi olmayan dəyişənlər yalnız serverdə görünür, sayta (brauzerə) düşmür.
import { envFrom, handleAiReport } from '../server/aiReport.js'

export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => ({}))
  const { status, json } = await handleAiReport(request.headers.get('authorization'), body, envFrom(process.env))
  return Response.json(json, { status })
}
