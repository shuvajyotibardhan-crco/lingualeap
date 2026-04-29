import { useState, useCallback } from 'react'
import { useProgress } from '../hooks/useProgress'
import { useTTS } from '../hooks/useTTS'
import { useASR } from '../hooks/useASR'
import { scoreAttempt } from '../lib/fuzzy'
import RewardAnimation from '../components/RewardAnimation'

export default function Roleplay({ level, phrases, onBack }) {
  const { awardXP, completeLevel } = useProgress()
  const { speak, isSpeaking }      = useTTS()
  const { startListening, stopListening, transcript, isListening, isSupported } = useASR()

  const [index, setIndex]                   = useState(0)
  const [stage, setStage]                   = useState('prompt') // 'prompt' | 'respond' | 'result'
  const [result, setResult]                 = useState(null)
  const [firstAttemptPasses, setFirstAttemptPasses] = useState(0)
  const [isFirstAttempt, setIsFirstAttempt] = useState(true)
  const [reward, setReward]                 = useState(null)

  const phrase = phrases[index]
  const isLast = index === phrases.length - 1

  const handlePrompt = useCallback(() => {
    speak(phrase.english)
    setStage('respond')
  }, [speak, phrase])

  const handleListen = useCallback(() => {
    if (isListening) stopListening()
    else startListening()
  }, [isListening, startListening, stopListening])

  const handleScore = useCallback(async () => {
    const outcome = scoreAttempt(transcript, phrase)
    setResult(outcome)
    setStage('result')
    if (outcome === 'pass') {
      await awardXP(isFirstAttempt)
      if (isFirstAttempt) setFirstAttemptPasses(n => n + 1)
    }
    setIsFirstAttempt(false)
  }, [transcript, phrase, awardXP, isFirstAttempt])

  const handleNext = useCallback(async () => {
    if (isLast) {
      const { stars, badges } = await completeLevel(level, firstAttemptPasses, phrases.length)
      setReward({ stars, badge: badges[badges.length - 1] })
    } else {
      setIndex(i => i + 1)
      setStage('prompt')
      setResult(null)
      setIsFirstAttempt(true)
    }
  }, [isLast, completeLevel, level, firstAttemptPasses, phrases.length])

  if (reward) return <RewardAnimation stars={reward.stars} badge={reward.badge} onDone={onBack} />

  return (
    <div className="min-h-screen bg-brand-yellow pb-10">
      <header className="bg-brand-orange px-4 py-3 flex items-center gap-3 shadow">
        <button onClick={onBack} aria-label="Back" className="text-white text-xl min-h-[44px] min-w-[44px] flex items-center justify-center">←</button>
        <h1 className="text-lg font-bold text-white">🎭 Roleplay — Level {level}</h1>
        <span className="ml-auto text-white/70 text-sm">{index + 1}/{phrases.length}</span>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-8 flex flex-col items-center gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6 w-full text-center">
          <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">The prompt:</p>
          <p className="text-xl font-bold text-gray-700">"{phrase.english}"</p>
          <p className="text-xs text-gray-400 mt-3">Say it in Spanish!</p>
        </div>

        {stage === 'prompt' && (
          <button
            onClick={handlePrompt}
            disabled={isSpeaking}
            className="bg-brand-orange text-white font-bold rounded-2xl px-8 py-3 min-h-[44px] hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            🔊 Hear the prompt
          </button>
        )}

        {stage === 'respond' && isSupported && (
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
              <>
                <div className="w-full bg-white rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">You said:</p>
                  <p className="text-gray-800 font-medium">"{transcript}"</p>
                </div>
                <button
                  onClick={handleScore}
                  className="bg-brand-orange text-white font-bold rounded-2xl px-8 py-3 min-h-[44px] hover:opacity-90"
                >
                  Check
                </button>
              </>
            )}
          </>
        )}

        {stage === 'respond' && !isSupported && (
          <div className="w-full flex flex-col gap-3">
            <p className="text-center text-sm text-gray-500">Tap the phrase you want to say:</p>
            <button
              onClick={async () => {
                await awardXP(isFirstAttempt)
                if (isFirstAttempt) setFirstAttemptPasses(n => n + 1)
                setResult('pass')
                setStage('result')
                setIsFirstAttempt(false)
              }}
              className="bg-white rounded-2xl shadow p-4 text-lg font-bold text-gray-800 hover:bg-brand-yellow/40 min-h-[44px]"
            >
              {phrase.spanish}
            </button>
          </div>
        )}

        {stage === 'result' && result === 'pass' && (
          <div className="bg-green-100 rounded-xl p-4 w-full text-center">
            <p className="text-green-700 font-bold text-lg">✅ ¡Perfecto!</p>
            <p className="text-gray-600 text-sm mt-1">{phrase.spanish}</p>
            <button onClick={handleNext} className="mt-3 bg-brand-orange text-white font-bold rounded-2xl px-8 py-3 min-h-[44px] hover:opacity-90">
              {isLast ? 'Finish level' : 'Next →'}
            </button>
          </div>
        )}

        {stage === 'result' && result === 'retry' && (
          <div className="bg-yellow-100 rounded-xl p-4 w-full text-center">
            <p className="text-yellow-700 font-bold">🔁 Not quite — the answer was:</p>
            <p className="text-gray-800 font-bold text-xl mt-1">{phrase.spanish}</p>
            <div className="flex gap-3 mt-3 justify-center">
              <button onClick={() => { setStage('respond'); setResult(null); setIsFirstAttempt(false) }} className="bg-white border-2 border-brand-orange text-brand-orange font-bold rounded-2xl px-6 py-2 min-h-[44px]">Retry</button>
              <button onClick={handleNext} className="bg-brand-orange text-white font-bold rounded-2xl px-6 py-2 min-h-[44px] hover:opacity-90">{isLast ? 'Finish' : 'Skip →'}</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
