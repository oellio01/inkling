import { useCallback, useState } from 'react'
import { GAME } from '../data/game_data'

type Status = 'correct' | 'present' | 'absent'

export function useGame() {
  const answer = GAME.answer
  const len    = answer.length

  const [guesses, setGuesses]   = useState<string[]>([])
  const [current, setCurrent]   = useState('')
  const [statuses, setStatuses] = useState<Record<string,Status>>({})
  const [showHint, setShowHint] = useState(false)
  const [running, setRunning]   = useState(true)

  const addGuess = useCallback(() => {
    if (current.length !== len) return
    // compute new statuses
    const newStat = { ...statuses }
    current.split('').forEach((ch, i) => {
      if (ch === answer[i]) newStat[ch] = 'correct'
      else if (answer.includes(ch)) newStat[ch] = 'present'
      else newStat[ch] = 'absent'
    })

    setStatuses(newStat)
    setGuesses(g => [...g, current])

    if (current === answer) {
      setRunning(false)
    }
    setCurrent('')
  }, [current, len, statuses])

  const onKey = useCallback((key: string, addPenalty: (p:number)=>void) => {
    if (!running) return

    if (key === 'BACK') {
      setCurrent(s => s.slice(0, -1))
    } else if (key === 'ENTER') {
      if (current.length < len) return
      if (current !== answer) addPenalty(10)
      addGuess()
    } else {
      if (current.length < len && /^[A-Z]$/.test(key)) {
        setCurrent(s => s + key)
      }
    }
  }, [current, len, running, addGuess])

  return {
    image:      GAME.image,
    answerLen:  len,
    guesses,
    current,
    statuses,
    showHint,
    setShowHint,
    running,
    onKey,
  }
}
