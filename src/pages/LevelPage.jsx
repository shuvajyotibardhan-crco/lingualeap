import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLevelData } from '../hooks/useLevelData'
import { useNounBank } from '../hooks/useNounBank'
import { useProgress } from '../hooks/useProgress'
import NounBank from '../components/NounBank'
import ContactButton from '../components/ContactButton'
import Discovery from '../modes/Discovery'
import ShadowChallenge from '../modes/ShadowChallenge'
import Roleplay from '../modes/Roleplay'
import QuickFire from '../modes/QuickFire'

const MODES = [
  { id: 'discovery', label: 'Discovery',       emoji: '👁️', description: 'Explore words & phrases' },
  { id: 'shadow',    label: 'Shadow Challenge', emoji: '🎤', description: 'Repeat what you hear' },
  { id: 'roleplay',  label: 'Roleplay',         emoji: '🎭', description: 'Respond to situations in Spanish' },
  { id: 'quickfire', label: 'Quick Fire',       emoji: '⚡', description: 'Listen and match the right card' },
]

export default function LevelPage() {
  const { levelId }  = useParams()
  const navigate     = useNavigate()
  const level        = Number(levelId)
  const { phrases, loading, error }         = useLevelData(level)
  const { entries: nounBankEntries }        = useNounBank()
  const { isLevelUnlocked, loading: progressLoading } = useProgress()
  const [activeMode, setActiveMode]         = useState(null)
  const [nounBankOpen, setNounBankOpen]     = useState(false)

  if (progressLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-yellow">
        <div className="text-4xl animate-bounce">🦜</div>
      </div>
    )
  }

  if (!isLevelUnlocked(level)) {
    navigate('/', { replace: true })
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-yellow">
        <div className="text-4xl animate-bounce">🦜</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-yellow gap-4 px-6">
        <p className="text-red-600 font-semibold text-center">Failed to load level {level}.</p>
        <button onClick={() => navigate('/')} className="underline text-brand-orange min-h-[44px]">
          Back to map
        </button>
      </div>
    )
  }

  const modeProps = { level, phrases, nounBankEntries, onBack: () => setActiveMode(null) }
  if (activeMode === 'discovery') return <Discovery {...modeProps} />
  if (activeMode === 'shadow')    return <ShadowChallenge {...modeProps} />
  if (activeMode === 'roleplay')  return <Roleplay {...modeProps} />
  if (activeMode === 'quickfire') return <QuickFire {...modeProps} />

  return (
    <div className="min-h-screen bg-brand-yellow pb-10">
      <header className="bg-brand-orange px-4 py-3 flex items-center gap-3 shadow">
        <button
          onClick={() => navigate('/')}
          aria-label="Back to level map"
          className="text-white text-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          ←
        </button>
        <h1 className="text-lg font-bold text-white">Level {level}</h1>
        <span className="text-white/70 text-sm">{phrases.length} phrases</span>
        <button
          onClick={() => setNounBankOpen(true)}
          className="ml-auto text-white font-bold text-sm bg-white/20 rounded-xl px-3 py-1 min-h-[36px] hover:bg-white/30 transition-colors"
        >
          📚 Word Bank
        </button>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-8 flex flex-col gap-4">
        <p className="text-center text-gray-600 font-medium mb-2">Choose a mode to play:</p>
        {MODES.map(({ id, label, emoji, description }) => (
          <button
            key={id}
            onClick={() => setActiveMode(id)}
            className="bg-white rounded-2xl shadow p-4 flex items-center gap-4 hover:bg-brand-yellow/40 transition-colors min-h-[64px] text-left"
          >
            <span className="text-3xl">{emoji}</span>
            <div>
              <p className="font-bold text-gray-800">{label}</p>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
          </button>
        ))}
      </main>

      <NounBank entries={nounBankEntries} isOpen={nounBankOpen} onClose={() => setNounBankOpen(false)} />
      <ContactButton />
    </div>
  )
}
