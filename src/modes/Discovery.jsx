import { useState } from 'react'
import PhraseCard from '../components/PhraseCard'
import NounBank from '../components/NounBank'

export default function Discovery({ level, phrases, nounBankEntries, onBack }) {
  const [nounBankOpen, setNounBankOpen] = useState(false)

  return (
    <div className="min-h-screen bg-brand-yellow pb-10">
      <header className="bg-brand-orange px-4 py-3 flex items-center gap-3 shadow">
        <button onClick={onBack} aria-label="Back to mode selector" className="text-white text-xl min-h-[44px] min-w-[44px] flex items-center justify-center">←</button>
        <h1 className="text-lg font-bold text-white">👁️ Discovery — Level {level}</h1>
        <button onClick={() => setNounBankOpen(true)} className="ml-auto text-white font-bold text-sm bg-white/20 rounded-xl px-3 py-1 min-h-[36px] hover:bg-white/30 transition-colors">
          📚 Word Bank
        </button>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 flex flex-col gap-4">
        <p className="text-center text-sm text-gray-600 mb-2">Tap 🔊 on any phrase to hear it spoken.</p>
        {phrases.map(phrase => (
          <PhraseCard key={phrase.id} phrase={phrase} showEnglish />
        ))}
        <button onClick={onBack} className="mt-4 bg-brand-orange text-white font-bold rounded-2xl py-3 min-h-[44px] hover:opacity-90 transition-opacity">
          Done exploring
        </button>
      </main>

      <NounBank entries={nounBankEntries} isOpen={nounBankOpen} onClose={() => setNounBankOpen(false)} />
    </div>
  )
}
