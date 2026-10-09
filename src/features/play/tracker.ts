import { completeSession, logAnswer, startSession, type AnswerEventInput } from '../../lib/api'
import type { SessionSummary } from '../../lib/types'

export type AnswerEvent = Omit<AnswerEventInput, 'session_id'>

export interface Tracker {
  log: (event: AnswerEvent) => void
  finish: () => Promise<SessionSummary | null>
}

/**
 * Dərs sessiyasını qeyd edir. Cavablar ardıcıl göndərilir (sıra pozulmasın),
 * bağlantı xətası olarsa dərs dayanmır — yalnız onError çağırılır.
 */
export function createTracker(childId: string, lessonSlug: string, onError: () => void): Tracker {
  let reported = false
  const fail = () => {
    if (!reported) {
      reported = true
      onError()
    }
  }
  const session = startSession(childId, lessonSlug).catch(() => {
    fail()
    return null
  })
  let chain: Promise<unknown> = session

  return {
    log(event) {
      chain = chain.then(async () => {
        const id = await session
        if (!id) return
        try {
          await logAnswer({
            ...event,
            session_id: id,
            response_ms: Math.max(0, Math.min(600000, Math.round(event.response_ms))),
          })
        } catch {
          fail()
        }
      })
    },
    async finish() {
      await chain
      const id = await session
      if (!id) return null
      try {
        return await completeSession(id)
      } catch {
        fail()
        return null
      }
    },
  }
}
