import { useState } from 'react'
import { useTTS } from '../hooks/useTTS'

const CATEGORIES = ['people', 'places', 'food', 'items']

export default function NounBank({ entries = [], isOpen, onClose }) {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0])
  const { speak } = useTTS()

  const filtered = entries.filter(e => e.category === activeCategory)

  if (!isOpen) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 bg-white rounded-t-3xl shadow-2xl max-h-[60vh] flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-lg font-bold text-gray-800">Noun Bank</h2>
        <button
          onClick={onClose}
          aria-label="Close Noun Bank"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>
      </div>

      <div className="flex gap-2 px-4 pb-2 overflow-x-auto">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={[
              'px-3 py-1 rounded-full text-sm font-medium capitalize whitespace-nowrap min-h-[36px] transition-colors',
              activeCategory === cat
                ? 'bg-brand-yellow text-gray-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            ].join(' ')}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="overflow-y-auto px-4 pb-6 grid grid-cols-2 gap-3">
        {filtered.map(entry => (
          <button
            key={entry.id}
            onClick={() => speak(entry.word)}
            className="bg-gray-50 rounded-xl p-3 text-left hover:bg-brand-yellow/20 transition-colors min-h-[44px]"
          >
            <p className="font-semibold text-gray-800">{entry.word}</p>
            <p className="text-xs text-gray-500">{entry.english}</p>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-2 text-center text-gray-400 py-4 text-sm">
            No words in this category yet.
          </p>
        )}
      </div>
    </div>
  )
}
