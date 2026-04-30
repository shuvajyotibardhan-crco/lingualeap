import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProgress } from '../hooks/useProgress'
import LevelCard from '../components/LevelCard'
import ContactButton from '../components/ContactButton'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { Settings } from 'lucide-react'

const LEVEL_META = [
  { level: 1,  theme: 'Greetings',       phase: 1 },
  { level: 2,  theme: 'The Café',         phase: 1 },
  { level: 3,  theme: 'Feelings',         phase: 1 },
  { level: 4,  theme: 'Directions',       phase: 1 },
  { level: 5,  theme: 'My Family',        phase: 2 },
  { level: 6,  theme: 'Playtime',         phase: 2 },
  { level: 7,  theme: 'Colors & Clothes', phase: 2 },
  { level: 8,  theme: 'Body & School',    phase: 2 },
  { level: 9,  theme: 'Marketplace',      phase: 3 },
  { level: 10, theme: 'Transport',        phase: 3 },
  { level: 11, theme: 'Schedules',        phase: 3 },
  { level: 12, theme: 'Help & Safety',    phase: 3 },
]

const PHASE_LABELS = {
  1: 'Phase 1 — Beginner',
  2: 'Phase 2 — Explorer',
  3: 'Phase 3 — Adventure',
}

export default function LevelMap() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { progress, isLevelUnlocked } = useProgress()

  const byPhase = [1, 2, 3].map(p => ({
    phase: p,
    levels: LEVEL_META.filter(m => m.phase === p),
  }))

  return (
    <div className="min-h-screen bg-brand-yellow pb-10">
      <header className="sticky top-0 z-10 bg-brand-orange shadow px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white leading-tight">LinguaLeap 🦜</h1>
          <p className="text-xs text-white/80">
            Hola, {user?.displayName || 'Explorer'} · {progress.xp ?? 0} XP
          </p>
        </div>
        <div className="flex items-center gap-2">
          {progress.badges?.length > 0 && (
            <span className="text-lg" title={progress.badges.join(', ')}>
              🏅×{progress.badges.length}
            </span>
          )}
          <button
            onClick={() => navigate('/settings')}
            aria-label="Settings"
            className="text-white/80 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={() => signOut(auth)}
            className="text-sm text-white/80 hover:text-white underline min-h-[44px] px-2"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 flex flex-col gap-8">
        {byPhase.map(({ phase, levels }) => (
          <section key={phase}>
            <h2 className="text-sm font-bold text-brand-orange uppercase tracking-wide mb-3">
              {PHASE_LABELS[phase]}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {levels.map(({ level, theme }) => (
                <LevelCard
                  key={level}
                  level={level}
                  theme={theme}
                  stars={progress.levelStars?.[String(level)] ?? 0}
                  unlocked={isLevelUnlocked(level)}
                  onClick={() => navigate(`/level/${level}`)}
                />
              ))}
            </div>
          </section>
        ))}
      </main>
      <ContactButton />
    </div>
  )
}
