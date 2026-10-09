import { useState } from 'react'
import { useNavigate } from 'react-router'
import { hasChildPin } from '../../lib/api'
import { setChildMode } from '../../lib/childMode'
import { SetPinModal } from '../../components/PinModal'

/** Uşaq rejimini açır; PIN hələ təyin edilməyibsə, əvvəlcə PIN istəyir. */
export function useStartChildMode() {
  const navigate = useNavigate()
  const [pendingChild, setPendingChild] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  const enter = (childId: string) => {
    setChildMode(childId)
    navigate(`/play/${childId}`)
  }

  const start = async (childId: string) => {
    setChecking(true)
    try {
      if (await hasChildPin()) enter(childId)
      else setPendingChild(childId)
    } finally {
      setChecking(false)
    }
  }

  const modal = (
    <SetPinModal
      open={pendingChild !== null}
      onClose={() => setPendingChild(null)}
      onDone={() => {
        const id = pendingChild
        setPendingChild(null)
        if (id) enter(id)
      }}
    />
  )

  return { start, checking, modal }
}
