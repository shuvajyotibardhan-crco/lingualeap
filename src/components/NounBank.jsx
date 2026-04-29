import { useState, useMemo } from 'react'
import { useTTS } from '../hooks/useTTS'

const CATEGORIES = [
  { id: 'all',       label: 'All' },
  { id: 'people',    label: 'People' },
  { id: 'places',    label: 'Places' },
  { id: 'food',      label: 'Food' },
  { id: 'animals',   label: 'Animals' },
  { id: 'body',      label: 'Body' },
  { id: 'clothing',  label: 'Clothing' },
  { id: 'nature',    label: 'Nature' },
  { id: 'transport', label: 'Transport' },
  { id: 'home',      label: 'Home' },
  { id: 'school',    label: 'School' },
  { id: 'colours',   label: 'Colours' },
  { id: 'time',      label: 'Time' },
]

export default function NounBank({ entries = [], isOpen, onClose }) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [query, setQuery] = useState('')
  const { speak } = useTTS()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return entries.filter(e => {
      const catMatch = activeCategory === 'all' || e.category === activeCategory
      if (!catMatch) return false
      if (!q) return true
      return e.word.toLowerCase().includes(q) || e.english.toLowerCase().includes(q)
    })
  }, [entries, activeCategory, query])

  if (!isOpen) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 bg-white rounded-t-3xl shadow-2xl max-h-[70vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <h2 className="text-lg font-bold text-gray-800">Noun Bank</h2>
        <button
          onClick={onClose}
          aria-label="Close Noun Bank"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-2 shrink-0">
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search words…"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 px-4 pb-2 overflow-x-auto shrink-0 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={[
              'px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap min-h-[36px] transition-colors',
              activeCategory === cat.id
                ? 'bg-brand-yellow text-gray-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            ].join(' ')}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="px-4 pb-1 text-xs text-gray-400 shrink-0">
        {filtered.length} word{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Word grid */}
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
          <p className="col-span-2 text-center text-gray-400 py-8 text-sm">
            No words found.
          </p>
        )}
      </div>
    </div>
  )
}
