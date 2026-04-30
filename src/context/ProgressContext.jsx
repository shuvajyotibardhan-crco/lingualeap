import { createContext, useContext, useEffect, useState } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './AuthContext'

const ProgressContext = createContext(null)

export const PASS_XP               = 10
export const FIRST_ATTEMPT_BONUS   = 5
const PHASE_BADGE_MAP              = { 4: 'phase1', 8: 'phase3', 12: 'phase4' }
export const LEGEND_BADGE          = 'linguaLegend'

const DEFAULT_PROGRESS = {
  xp: 0,
  levelStars: {},
  badges: [],
  unlockedLevels: [1],
}

export function ProgressProvider({ children }) {
  const { user } = useAuth()
  const [progress, setProgress] = useState(DEFAULT_PROGRESS)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!user) {
      setProgress(DEFAULT_PROGRESS)
      setLoading(false)
      return
    }

    const ref = doc(db, 'users', user.uid)

    async function loadOrCreate() {
      try {
        const snap = await getDoc(ref)
        if (snap.exists()) {
          setProgress(snap.data())
        } else {
          const initial = {
            ...DEFAULT_PROGRESS,
            uid:         user.uid,
            username:    user.displayName || '',
            email:       user.email || '',
            lastUpdated: serverTimestamp(),
          }
          await setDoc(ref, initial)
          setProgress(initial)
        }
      } catch (err) {
        console.error('Failed to load progress:', err)
      } finally {
        setLoading(false)
      }
    }

    loadOrCreate()
  }, [user])

  async function persist(updates) {
    if (!user) return
    const next = { ...progress, ...updates, lastUpdated: serverTimestamp() }
    setProgress(next)
    await setDoc(doc(db, 'users', user.uid), next, { merge: true })
  }

  async function awardXP(wasFirstAttempt) {
    const bonus = wasFirstAttempt ? FIRST_ATTEMPT_BONUS : 0
    await persist({ xp: (progress.xp || 0) + PASS_XP + bonus })
  }

  // Called once at level completion. Handles stars, unlock, and all badge checks atomically.
  async function completeLevel(level, firstAttemptPasses, totalPhrases) {
    const stars      = calculateStars(totalPhrases, firstAttemptPasses)
    const levelStars = { ...progress.levelStars, [String(level)]: stars }

    const nextLevel      = level + 1
    const unlockedLevels = nextLevel > 12 || (progress.unlockedLevels || [1]).includes(nextLevel)
      ? (progress.unlockedLevels || [1])
      : [...(progress.unlockedLevels || [1]), nextLevel]

    const badges     = [...(progress.badges || [])]
    const phaseBadge = PHASE_BADGE_MAP[level]
    if (phaseBadge && !badges.includes(phaseBadge)) badges.push(phaseBadge)

    const allDone = Object.keys(levelStars).length === 12
    if (allDone && !badges.includes(LEGEND_BADGE)) badges.push(LEGEND_BADGE)

    await persist({ levelStars, unlockedLevels, badges })
    return { stars, badges, isLinguaLegend: allDone }
  }

  function isLevelUnlocked(level) {
    return (progress.unlockedLevels || [1]).includes(level)
  }

  function calculateStars(totalPhrases, firstAttemptPasses) {
    const ratio = firstAttemptPasses / totalPhrases
    if (ratio === 1)    return 3
    if (ratio >= 0.6)   return 2
    return 1
  }

  return (
    <ProgressContext.Provider value={{
      progress,
      loading,
      awardXP,
      completeLevel,
      isLevelUnlocked,
      calculateStars,
    }}>
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress() {
  return useContext(ProgressContext)
}
