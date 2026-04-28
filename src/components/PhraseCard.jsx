import { useTTS } from '../hooks/useTTS'

export default function PhraseCard({ phrase, showEnglish = true }) {
  const { speak, isSpeaking } = useTTS()

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-2xl font-bold text-gray-800">{phrase.spanish}</span>
        <button
          onClick={() => speak(phrase.spanish)}
          disabled={isSpeaking}
          aria-label="Play pronunciation"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-brand-yellow hover:bg-brand-orange transition-colors disabled:opacity-50"
        >
          🔊
        </button>
      </div>
      {showEnglish && (
        <span className="text-base text-gray-500">{phrase.english}</span>
      )}
      <span className="text-xs text-gray-400 italic">{phrase.audioHint}</span>
    </div>
  )
}
