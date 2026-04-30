import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'

export default function UsersTab() {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    getDocs(collection(db, 'users'))
      .then(snap => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = users.filter(u =>
    (u.username || '').toLowerCase().includes(filter.toLowerCase()) ||
    (u.email    || '').toLowerCase().includes(filter.toLowerCase())
  )

  if (loading) return <p className="text-gray-500 text-sm p-4">Loading users…</p>

  return (
    <div>
      <input
        type="search"
        placeholder="Filter by name or email…"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-brand-orange focus:outline-none font-display text-gray-800 mb-4"
      />

      {filtered.length === 0 && <p className="text-gray-400 text-sm">No users found.</p>}

      <div className="flex flex-col gap-2">
        {filtered.map(u => (
          <div key={u.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === u.id ? null : u.id)}
              className="w-full px-4 py-3 flex items-center justify-between text-left min-h-[52px]"
            >
              <div>
                <p className="font-bold text-gray-800">{u.username || '—'}</p>
                <p className="text-xs text-gray-500">{u.email || '—'}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-brand-orange">{u.xp ?? 0} XP</span>
                <span className="text-gray-400 text-lg">{expanded === u.id ? '▲' : '▼'}</span>
              </div>
            </button>

            {expanded === u.id && (
              <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 text-sm">
                <p className="font-bold text-gray-600 mb-2">Levels completed:</p>
                <div className="grid grid-cols-6 gap-1 mb-3">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(lvl => {
                    const stars = u.levelStars?.[String(lvl)] ?? 0
                    return (
                      <div key={lvl} className={`rounded-lg p-1 text-center text-xs ${stars > 0 ? 'bg-brand-green text-white' : 'bg-gray-200 text-gray-400'}`}>
                        <div className="font-bold">L{lvl}</div>
                        <div>{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>
                      </div>
                    )
                  })}
                </div>
                <p className="text-gray-600">
                  <span className="font-bold">Badges:</span>{' '}
                  {u.badges?.length > 0 ? u.badges.join(', ') : 'None yet'}
                </p>
                <p className="text-gray-500 text-xs mt-1">UID: {u.id}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
