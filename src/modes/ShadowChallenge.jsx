import { useState, useCallback } from 'react'
import { useProgress } from '../hooks/useProgress'
import { useTTS } from '../hooks/useTTS'
import { useASR } from '../hooks/useASR'
import { scoreAttempt } from '../lib/fuzzy'
import RewardAnimation from '../components/RewardAnimation'

export default function ShadowChallenge({ level, phrases, onBack }) {
  const { awardXP, completeLevel } = useProgress()
  const { speak, isSpeaking }      = useTTS()
  const { startListening, stopListening, transcript, isListening, isSupported } = useASR()

  const [index, setIndex]                   = useState(0)
  const [result, setResult]                 = useState(null) // 'pass' | 'retry' | null
  const [firstAttemptPasses, setFirstAttemptPasses] = useState(0)
  const [isFirstAttempt, setIsFirstAttempt] = useState(true)
  const [reward, setReward]                 = useState(null) // { stars, badge }

  const phrase = phrases[index]
  const isLast = index === phrases.length - 1

  const handleSpeak = useCallback(() => {
    speak(phrase.spanish)
  }, [speak, phrase])

  const handleListen = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      setResult(null)
      startListening()
    }
  }, [isListening, startListening, stopListening])

  const handleScore = useCallback(async () => {
    const outcome = scoreAttempt(transcript, phrase)
    setResult(outcome)
    if (outcome === 'pass') {
      await awardXP(isFirstAttempt)
      if (isFirstAttempt) setFirstAttemptPasses(n => n + 1)
    }
    setIsFirstAttempt(false)
  }, [transcript, phrase, awardXP, isFirstAttempt])

  const handleNext = useCallback(async () => {
    if (isLast) {
      const { stars, badges } = await completeLevel(level, firstAttemptPasses, phrases.length)
      const newBadge = badges[badges.length - 1]
      setReward({ stars, badge: newBadge })
    } else {
      setIndex(i => i + 1)
      setResult(null)
      setIsFirstAttempt(true)
    }
  }, [isLast, firstAttemptPasses, completeLevel, level, phrases.length])

  if (reward) {
    return <RewardAnimation stars={reward.stars} badge={reward.badge} onDone={onBack} />
  }

  return (
    <div className="min-h-screen bg-brand-yellow pb-10">
      <header className="bg-brand-orange px-4 py-3 flex items-center gap-3 shadow">
        <button onClick={onBack} aria-label="Back" className="text-white text-xl min-h-[44px] min-w-[44px] flex items-center justify-center">←</button>
        <h1 className="text-lg font-bold text-white">🎤 Shadow Challenge — Level {level}</h1>
        <span className="ml-auto text-white/70 text-sm">{index + 1}/{phrases.length}</span>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-8 flex flex-col items-center gap-6">
        <p className="text-center text-gray-600 text-sm">Listen, then repeat the phrase.</p>

        <div className="bg-white rounded-2xl shadow-md p-6 w-full text-center">
          <p className="text-3xl font-bold text-gray-800 mb-1">{phrase.spanish}</p>
          <p className="text-gray-500">{phrase.english}</p>
          <p className="text-xs text-gray-400 italic mt-1">{phrase.audioHint}</p>
        </div>

        <button
          onClick={handleSpeak}
          disabled={isSpeaking}
          className="bg-brand-yellow rounded-full w-16 h-16 text-3xl flex items-center justify-center shadow hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
        >
          🔊
        </button>

        {isSupported ? (
          <>
            <button
              onClick={handleListen}
              className={[
                'rounded-full w-16 h-16 text-3xl flex items-center justify-center shadow transition-transform hover:scale-105 active:scale-95',
                isListening ? 'bg-red-400 animate-pulse' : 'bg-white',
              ].join(' ')}
            >
              🎤
            </button>

            {transcript && !isListening && (
              <div className="w-full bg-white rounded-xl p-3 text-center">
                <p className="text-gray-500 text-xs mb-1">You said:</p>
                <p className="text-gray-800 font-medium">"{transcript}"</p>
              </div>
            )}

            {transcript && !isListening && !result && (
              <button
                onClick={handleScore}
                className="bg-brand-orange text-white font-bold rounded-2xl px-8 py-3 min-h-[44px] hover:opacity-90 transition-opacity"
              >
                Check
              </button>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500 text-center">
            Microphone not supported in this browser. Use Chrome or Edge for speaking practice.
          </p>
        )}

        {result === 'pass' && (
          <div className="bg-green-100 rounded-xl p-4 w-full text-center">
            <p className="text-green-700 font-bold text-lg">✅ Great match!</p>
            <button
              onClick={handleNext}
              className="mt-3 bg-brand-orange text-white font-bold rounded-2xl px-8 py-3 min-h-[44px] hover:opacity-90 transition-opacity"
            >
              {isLast ? 'Finish level' : 'Next phrase →'}
            </button>
          </div>
        )}

        {result === 'retry' && (
          <div className="bg-yellow-100 rounded-xl p-4 w-full text-center">
            <p className="text-yellow-700 font-bold text-lg">🔁 Try again!</p>
            <div className="flex gap-3 mt-3 justify-center">
              <button
                onClick={() => { setResult(null); setIsFirstAttempt(false) }}
                className="bg-white border-2 border-brand-orange text-brand-orange font-bold rounded-2xl px-6 py-2 min-h-[44px]"
              >
                Retry
              </button>
              <button
                onClick={handleNext}
                className="bg-brand-orange text-white font-bold rounded-2xl px-6 py-2 min-h-[44px] hover:opacity-90"
              >
                {isLast ? 'Finish anyway' : 'Skip →'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
