import { useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { useCallable } from '../hooks/useCallable'

// ── User search (min 3 chars, wildcard) ─────────────────────────────────────

function UserSearch({ onSelect, selectedUid }) {
  const [query, setQuery]       = useState('')
  const [users, setUsers]       = useState([])
  const [searched, setSearched] = useState(false)

  const canSearch = query.trim().length >= 3

  async function search() {
    if (!canSearch) return
    const snap = await getDocs(collection(db, 'users'))
    const all  = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    const q    = query.toLowerCase()
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
          onChange={e => { setQuery(e.target.value); setSearched(false) }}
          onKeyDown={e => e.key === 'Enter' && search()}
          className="flex-1 px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-brand-orange focus:outline-none text-sm"
        />
        <button
          onClick={search}
          disabled={!canSearch}
          className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold min-h-[44px] disabled:opacity-40"
        >
          Search
        </button>
      </div>
      {query.length > 0 && !canSearch && (
        <p className="text-gray-400 text-xs">{3 - query.trim().length} more character{3 - query.trim().length > 1 ? 's' : ''} needed.</p>
      )}
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

// ── PDF proof uploader ───────────────────────────────────────────────────────

function ProofUpload({ action, targetUid, onUploaded }) {
  const { user } = useAuth()
  const [uploading, setUploading]   = useState(false)
  const [progress, setProgress]     = useState(0)
  const [fileName, setFileName]     = useState('')
  const [uploadedUrl, setUploadedUrl] = useState(null)

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are accepted.')
      e.target.value = ''
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File must be under 10 MB.')
      e.target.value = ''
      return
    }

    setFileName(file.name)
    setUploading(true)
    setProgress(0)

    const path     = `admin-proofs/${action}/${targetUid}/${user.uid}_${Date.now()}.pdf`
    const stRef    = ref(storage, path)
    const task     = uploadBytesResumable(stRef, file)

    task.on(
      'state_changed',
      snap => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      err  => { alert('Upload failed: ' + err.message); setUploading(false) },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        setUploadedUrl(url)
        setUploading(false)
        onUploaded(url)
      }
    )
  }

  function remove() {
    setUploadedUrl(null)
    setFileName('')
    onUploaded(null)
  }

  if (uploadedUrl) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-sm">
        <span className="text-green-700 font-bold truncate mr-2">Proof uploaded: {fileName}</span>
        <button onClick={remove} className="text-gray-400 text-xs underline shrink-0">Remove</button>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-bold text-gray-600">Supporting proof (PDF, max 10 MB) <span className="text-red-500">*</span></p>
      {uploading ? (
        <div className="flex items-center gap-2 text-sm text-brand-orange">
          <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-brand-orange transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="shrink-0">{progress}%</span>
        </div>
      ) : (
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFile}
          className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
        />
      )}
    </div>
  )
}

// ── Panel wrapper ────────────────────────────────────────────────────────────

function Panel({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
      <h3 className="font-extrabold text-gray-700">{title}</h3>
      {children}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function SettingsTab() {
  const [pwUser, setPwUser]       = useState(null)
  const [pwProof, setPwProof]     = useState(null)
  const [pwSuccess, setPwSuccess] = useState(false)

  const [unUser, setUnUser]       = useState(null)
  const [unValue, setUnValue]     = useState('')
  const [unProof, setUnProof]     = useState(null)
  const [unSuccess, setUnSuccess] = useState(false)

  const [emUser, setEmUser]       = useState(null)
  const [emValue, setEmValue]     = useState('')
  const [emProof, setEmProof]     = useState(null)
  const [emSuccess, setEmSuccess] = useState(false)

  const { call: resetPw,  loading: pwLoading  } = useCallable('adminResetPassword')
  const { call: updateUn, loading: unLoading  } = useCallable('adminUpdateUsername')
  const { call: changeEm, loading: emLoading  } = useCallable('initiateEmailChange')

  async function handleResetPassword() {
    if (!pwUser || !pwProof) return
    try {
      await resetPw({ targetUid: pwUser.id, proofUrl: pwProof })
      setPwSuccess(true)
    } catch (err) { alert('Error: ' + err.message) }
  }

  async function handleUpdateUsername() {
    if (!unUser || !unValue.trim() || !unProof) return
    try {
      await updateUn({ targetUid: unUser.id, newUsername: unValue.trim(), proofUrl: unProof })
      setUnSuccess(true)
    } catch (err) { alert('Error: ' + err.message) }
  }

  async function handleChangeEmail() {
    if (!emUser || !emValue.trim() || !emProof) return
    try {
      await changeEm({ targetUid: emUser.id, newEmail: emValue.trim(), proofUrl: emProof })
      setEmSuccess(true)
    } catch (err) { alert('Error: ' + err.message) }
  }

  return (
    <div className="space-y-4">

      {/* Reset Password */}
      <Panel title="Reset Password">
        <UserSearch
          onSelect={u => { setPwUser(u); setPwProof(null); setPwSuccess(false) }}
          selectedUid={pwUser?.id}
        />
        {pwUser && !pwSuccess && (
          <>
            <ProofUpload action="resetPassword" targetUid={pwUser.id} onUploaded={setPwProof} />
            <button
              onClick={handleResetPassword}
              disabled={pwLoading || !pwProof}
              className="w-full py-3 bg-brand-orange text-white font-bold rounded-xl disabled:opacity-40 min-h-[44px]"
            >
              {pwLoading ? 'Resetting…' : `Reset password for ${pwUser.username}`}
            </button>
          </>
        )}
        {pwSuccess && <p className="text-green-600 font-bold text-sm">Password reset — temp password emailed to user</p>}
      </Panel>

      {/* Update Username */}
      <Panel title="Update Username">
        <UserSearch
          onSelect={u => { setUnUser(u); setUnValue(''); setUnProof(null); setUnSuccess(false) }}
          selectedUid={unUser?.id}
        />
        {unUser && !unSuccess && (
          <>
            <input
              type="text"
              placeholder="New username…"
              value={unValue}
              onChange={e => setUnValue(e.target.value)}
              maxLength={40}
              className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-brand-orange focus:outline-none text-sm"
            />
            <ProofUpload action="updateUsername" targetUid={unUser.id} onUploaded={setUnProof} />
            <button
              onClick={handleUpdateUsername}
              disabled={unLoading || !unValue.trim() || !unProof}
              className="w-full py-3 bg-brand-orange text-white font-bold rounded-xl disabled:opacity-40 min-h-[44px]"
            >
              {unLoading ? 'Updating…' : `Set username for ${unUser.username}`}
            </button>
          </>
        )}
        {unSuccess && <p className="text-green-600 font-bold text-sm">Username updated</p>}
      </Panel>

      {/* Update Login Email */}
      <Panel title="Update Login Email">
        <UserSearch
          onSelect={u => { setEmUser(u); setEmValue(''); setEmProof(null); setEmSuccess(false) }}
          selectedUid={emUser?.id}
        />
        {emUser && !emSuccess && (
          <>
            <input
              type="email"
              placeholder="New email address…"
              value={emValue}
              onChange={e => setEmValue(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-brand-orange focus:outline-none text-sm"
            />
            <ProofUpload action="updateEmail" targetUid={emUser.id} onUploaded={setEmProof} />
            <button
              onClick={handleChangeEmail}
              disabled={emLoading || !emValue.trim() || !emProof}
              className="w-full py-3 bg-brand-orange text-white font-bold rounded-xl disabled:opacity-40 min-h-[44px]"
            >
              {emLoading ? 'Sending…' : `Send email-change link to ${emUser.username}`}
            </button>
          </>
        )}
        {emSuccess && <p className="text-green-600 font-bold text-sm">Confirmation email sent to user's current email address</p>}
      </Panel>

    </div>
  )
}
