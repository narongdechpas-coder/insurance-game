import { useMemo } from 'react'
import type { Draft } from '../../game/choiceForecast'
import { useGameStore } from '../../store/useGameStore'

/** The decision room's draft (plan, responses, prices, channels, people, systems), memoised. */
export function useDraft(): Draft {
  const plan = useGameStore((s) => s.plan)
  const responses = useGameStore((s) => s.responses)
  const channels = useGameStore((s) => s.channels)
  const steps = useGameStore((s) => s.segSteps)
  const staff = useGameStore((s) => s.staff)
  const orders = useGameStore((s) => s.sysOrders)
  return useMemo(() => ({ plan, responses, channels, steps, staff, orders }), [plan, responses, channels, steps, staff, orders])
}
