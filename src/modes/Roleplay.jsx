import { useState, useCallback } from 'react'
import { useProgress } from '../hooks/useProgress'
import { useTTS } from '../hooks/useTTS'
import { useASR } from '../hooks/useASR'
import { scoreAttempt } from '../lib/fuzzy'
import RewardAnimation from '../components/RewardAnimation'
import NounBank from '../components/NounBank'
import ContactButton from '../components/ContactButton'

export default function Roleplay({ level, phrases, nounBankEntries, onBack }) {
  const { awardXP, completeLevel } = useProgress()
  const { speak, isSpeaking }      = useTTS()
  const { startListening, stopListening, transcript, isListening, isSupported } = useASR()

  const [index, setIndex]                   = useState(0)
  const [stage, setStage]                   = useState('prompt')
  const [result, setResult]                 = useState(null)
  const [firstAttemptPasses, setFirstAttemptPasses] = useState(0)
  const [isFirstAttempt, setIsFirstAttempt] = useState(true)
  const [reward, setReward]                 = useState(null)
  const [nounBankOpen, setNounBankOpen]     = useState(false)

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
        <span className="text-white/70 text-sm">{index + 1}/{phrases.length}</span>
        <button onClick={() => setNounBankOpen(true)} className="text-white font-bold text-sm bg-white/20 rounded-xl px-3 py-1 min-h-[36px] hover:bg-white/30 transition-colors">
          📚
        </button>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 flex flex-col items-center gap-5">
        {/* How to play banner */}
        <div className="bg-brand-orange/10 border border-brand-orange/30 rounded-xl px-4 py-3 w-full text-center">
          <p className="text-sm font-bold text-brand-orange">How to play 🎭</p>
          <p className="text-xs text-gray-600 mt-1">
            Listen to the situation in English. Then <strong>say</strong> (or tap) the correct Spanish phrase to respond!
          </p>
        </div>

        {/* Situation card */}
        <div className="bg-white rounded-2xl shadow-md p-6 w-full text-center">
          <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Someone says to you:</p>
          <p className="text-2xl font-bold text-gray-800">"{phrase.english}"</p>
          <p className="text-xs text-brand-orange font-semibold mt-3">👉 Respond in Spanish!</p>
        </div>

        {stage === 'prompt' && (
          <button
            onClick={handlePrompt}
            disabled={isSpeaking}
            className="bg-brand-orange text-white font-bold rounded-2xl px-8 py-3 min-h-[44px] hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            🔊 Hear it in English first
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
      <NounBank entries={nounBankEntries} isOpen={nounBankOpen} onClose={() => setNounBankOpen(false)} />
      <ContactButton />
    </div>
  )
}
