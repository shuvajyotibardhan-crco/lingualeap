import { useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useCallable } from '../hooks/useCallable'

function UserSearch({ onSelect, selectedUid }) {
  const [query, setQuery]   = useState('')
  const [users, setUsers]   = useState([])
  const [searched, setSearched] = useState(false)

  async function search() {
    if (!query.trim()) return
    const snap = await getDocs(collection(db, 'users'))
    const all  = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    const q = query.toLowerCase()
    setUsers(all.filter(u =>
      (u.username || '').toLowerCase().includes(q) ||
      (u.email    || '').toLowerCase().includes(q)
    ))
    setSearched(true)
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          className="flex-1 px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-brand-orange focus:outline-none text-sm"
        />
        <button onClick={search} className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold min-h-[44px]">Search</button>
      </div>
      {searched && users.length === 0 && <p className="text-gray-400 text-sm">No users found.</p>}
      {users.map(u => (
        <button
          key={u.id}
          onClick={() => onSelect(u)}
          className={`w-full text-left px-3 py-2 rounded-xl border-2 text-sm transition-colors min-h-[44px] ${selectedUid === u.id ? 'border-brand-orange bg-brand-yellow/20' : 'border-gray-100 hover:border-gray-300'}`}
        >
          <span className="font-bold">{u.username || '—'}</span>
          <span className="text-gray-500 ml-2">{u.email}</span>
        </button>
      ))}
    </div>
  )
}

function Panel({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
      <h3 className="font-extrabold text-gray-700">{title}</h3>
      {children}
    </div>
  )
}

export default function SettingsTab() {
  const [pwUser, setPwUser]           = useState(null)
  const [unUser, setUnUser]           = useState(null)
  const [unValue, setUnValue]         = useState('')
  const [emUser, setEmUser]           = useState(null)
  const [emValue, setEmValue]         = useState('')
  const [pwSuccess, setPwSuccess]     = useState(false)
  const [unSuccess, setUnSuccess]     = useState(false)
  const [emSuccess, setEmSuccess]     = useState(false)

  const { call: resetPw,  loading: pwLoading  } = useCallable('adminResetPassword')
  const { call: updateUn, loading: unLoading  } = useCallable('adminUpdateUsername')
  const { call: changeEm, loading: emLoading  } = useCallable('initiateEmailChange')

  async function handleResetPassword() {
    if (!pwUser) return
    try {
      await resetPw({ targetUid: pwUser.id })
      setPwSuccess(true)
    } catch (err) { alert('Error: ' + err.message) }
  }

  async function handleUpdateUsername() {
    if (!unUser || !unValue.trim()) return
    try {
      await updateUn({ targetUid: unUser.id, newUsername: unValue.trim() })
      setUnSuccess(true)
    } catch (err) { alert('Error: ' + err.message) }
  }

  async function handleChangeEmail() {
    if (!emUser || !emValue.trim()) return
    try {
      await changeEm({ targetUid: emUser.id, newEmail: emValue.trim() })
      setEmSuccess(true)
    } catch (err) { alert('Error: ' + err.message) }
  }

  return (
    <div className="space-y-4">
      <Panel title="Reset Password">
        <UserSearch onSelect={u => { setPwUser(u); setPwSuccess(false) }} selectedUid={pwUser?.id} />
        {pwUser && !pwSuccess && (
          <button
            onClick={handleResetPassword}
            disabled={pwLoading}
            className="w-full py-3 bg-brand-orange text-white font-bold rounded-xl disabled:opacity-50 min-h-[44px]"
          >
            {pwLoading ? 'Resetting…' : `Reset password for ${pwUser.username}`}
          </button>
        )}
        {pwSuccess && <p className="text-green-600 font-bold text-sm">✅ Password reset — temp password emailed to user</p>}
      </Panel>

      <Panel title="Update Username">
        <UserSearch onSelect={u => { setUnUser(u); setUnValue(''); setUnSuccess(false) }} selectedUid={unUser?.id} />
        {unUser && !unSuccess && (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="New username…"
              value={unValue}
              onChange={e => setUnValue(e.target.value)}
              maxLength={40}
              className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-brand-orange focus:outline-none text-sm"
            />
            <button
              onClick={handleUpdateUsername}
              disabled={unLoading || !unValue.trim()}
              className="w-full py-3 bg-brand-orange text-white font-bold rounded-xl disabled:opacity-50 min-h-[44px]"
            >
              {unLoading ? 'Updating…' : `Set username for ${unUser.username}`}
            </button>
          </div>
        )}
        {unSuccess && <p className="text-green-600 font-bold text-sm">✅ Username updated</p>}
      </Panel>

      <Panel title="Update Login Email">
        <UserSearch onSelect={u => { setEmUser(u); setEmValue(''); setEmSuccess(false) }} selectedUid={emUser?.id} />
        {emUser && !emSuccess && (
          <div className="space-y-2">
            <input
              type="email"
              placeholder="New email address…"
              value={emValue}
              onChange={e => setEmValue(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-brand-orange focus:outline-none text-sm"
            />
            <button
              onClick={handleChangeEmail}
              disabled={emLoading || !emValue.trim()}
              className="w-full py-3 bg-brand-orange text-white font-bold rounded-xl disabled:opacity-50 min-h-[44px]"
            >
              {emLoading ? 'Sending…' : `Send email-change link to ${emUser.username}`}
            </button>
          </div>
        )}
        {emSuccess && <p className="text-green-600 font-bold text-sm">✅ Confirmation email sent to user's current email address</p>}
      </Panel>
    </div>
  )
}
