import { useState, useEffect, useCallback } from 'react'
import { useProgress } from '../hooks/useProgress'
import { useTTS } from '../hooks/useTTS'
import RewardAnimation from '../components/RewardAnimation'
import NounBank from '../components/NounBank'

const ROUND_TIME = 8 // seconds per phrase

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

function buildChoices(phrases, correctIndex) {
  const correct = phrases[correctIndex]
  const others  = shuffle(phrases.filter((_, i) => i !== correctIndex)).slice(0, 3)
  return shuffle([correct, ...others])
}

export default function QuickFire({ level, phrases, nounBankEntries, onBack }) {
  const { awardXP, completeLevel } = useProgress()
  const { speak }                  = useTTS()

  const [index, setIndex]                   = useState(0)
  const [choices, setChoices]               = useState(() => buildChoices(phrases, 0))
  const [selected, setSelected]             = useState(null)
  const [timeLeft, setTimeLeft]             = useState(ROUND_TIME)
  const [firstAttemptPasses, setFirstAttemptPasses] = useState(0)
  const [isFirstAttempt, setIsFirstAttempt] = useState(true)
  const [reward, setReward]                 = useState(null)
  const [nounBankOpen, setNounBankOpen]     = useState(false)

  const phrase = phrases[index]
  const isLast = index === phrases.length - 1

  // Auto-speak on each new phrase
  useEffect(() => {
    speak(phrase.spanish)
    setTimeLeft(ROUND_TIME)
    setSelected(null)
    setIsFirstAttempt(true)
  }, [index]) // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer
  useEffect(() => {
    if (selected !== null) return
    if (timeLeft <= 0) {
      handlePick(null) // time out = wrong
      return
    }
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, selected]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePick = useCallback(async (choice) => {
    if (selected !== null) return
    setSelected(choice)

    const correct = choice?.id === phrase.id
    if (correct) {
      await awardXP(isFirstAttempt)
      if (isFirstAttempt) setFirstAttemptPasses(n => n + 1)
    }
  }, [selected, phrase, awardXP, isFirstAttempt])

  const handleNext = useCallback(async () => {
    if (isLast) {
      const { stars, badges } = await completeLevel(level, firstAttemptPasses, phrases.length)
      setReward({ stars, badge: badges[badges.length - 1] })
    } else {
      const next = index + 1
      setIndex(next)
      setChoices(buildChoices(phrases, next))
      setIsFirstAttempt(true)
    }
  }, [isLast, index, phrases, level, firstAttemptPasses, completeLevel])

  if (reward) return <RewardAnimation stars={reward.stars} badge={reward.badge} onDone={onBack} />

  const timerPct = (timeLeft / ROUND_TIME) * 100

  return (
    <div className="min-h-screen bg-brand-yellow pb-10">
      <header className="bg-brand-orange px-4 py-3 flex items-center gap-3 shadow">
        <button onClick={onBack} aria-label="Back" className="text-white text-xl min-h-[44px] min-w-[44px] flex items-center justify-center">←</button>
        <h1 className="text-lg font-bold text-white">⚡ Quick Fire — Level {level}</h1>
        <span className="text-white/70 text-sm">{index + 1}/{phrases.length}</span>
        <button onClick={() => setNounBankOpen(true)} className="text-white font-bold text-sm bg-white/20 rounded-xl px-3 py-1 min-h-[36px] hover:bg-white/30 transition-colors">
          📚
        </button>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 flex flex-col items-center gap-5">
        {/* Timer bar */}
        <div className="w-full h-3 bg-white/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-orange rounded-full transition-all duration-1000"
            style={{ width: `${timerPct}%` }}
          />
        </div>

        {/* Audio prompt — no text shown, listen to find the match */}
        <div className="bg-white rounded-2xl shadow-md p-5 w-full text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Listen, then pick the matching card!</p>
          <button
            onClick={() => speak(phrase.spanish)}
            className="w-16 h-16 rounded-full bg-brand-yellow flex items-center justify-center text-3xl mx-auto hover:scale-105 active:scale-95 transition-transform shadow"
            aria-label="Replay audio"
          >
            🔊
          </button>
          <p className="text-xs text-gray-400 mt-2">Tap 🔊 to hear it again</p>
        </div>

        {/* Choice grid */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {choices.map(choice => {
            const isCorrect = choice.id === phrase.id
            const isPicked  = selected?.id === choice.id
            const showResult = selected !== null

            let bg = 'bg-white hover:bg-brand-yellow/30'
            if (showResult && isCorrect)  bg = 'bg-green-100 border-2 border-green-500'
            if (showResult && isPicked && !isCorrect) bg = 'bg-red-100 border-2 border-red-400'

            return (
              <button
                key={choice.id}
                onClick={() => handlePick(choice)}
                disabled={selected !== null}
                className={`${bg} rounded-2xl shadow p-4 text-center transition-colors min-h-[80px] flex flex-col items-center justify-center gap-1 disabled:cursor-default`}
              >
                <span className="text-lg font-bold text-gray-800">{choice.spanish}</span>
                <span className="text-xs text-gray-500">{choice.english}</span>
              </button>
            )
          })}
        </div>

        {/* Result feedback + next */}
        {selected !== null && (
          <div className={`w-full rounded-xl p-4 text-center ${selected?.id === phrase.id ? 'bg-green-100' : 'bg-red-100'}`}>
            <p className={`font-bold text-lg ${selected?.id === phrase.id ? 'text-green-700' : 'text-red-600'}`}>
              {selected?.id === phrase.id ? '✅ Correct!' : `❌ It was: ${phrase.spanish}`}
            </p>
            <button
              onClick={handleNext}
              className="mt-3 bg-brand-orange text-white font-bold rounded-2xl px-8 py-3 min-h-[44px] hover:opacity-90 transition-opacity"
            >
              {isLast ? 'Finish level' : 'Next →'}
            </button>
          </div>
        )}
      </main>
      <NounBank entries={nounBankEntries} isOpen={nounBankOpen} onClose={() => setNounBankOpen(false)} />
    </div>
  )
}
