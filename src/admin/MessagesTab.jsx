import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useCallable } from '../hooks/useCallable'

export default function MessagesTab() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading]   = useState(true)
  const [replyText, setReplyText] = useState({})
  const [replySuccess, setReplySuccess] = useState({})
  const { call: sendReply, loading: replying } = useCallable('adminReplyToContact')

  useEffect(() => {
    getDocs(collection(db, 'contactMessages'))
      .then(snap => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        docs.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
        setMessages(docs)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleReply(messageId) {
    const text = replyText[messageId]
    if (!text?.trim()) return
    try {
      await sendReply({ messageId, replyText: text.trim() })
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'resolved' } : m))
      setReplySuccess(prev => ({ ...prev, [messageId]: true }))
    } catch (err) {
      alert('Reply failed: ' + err.message)
    }
  }

  if (loading) return <p className="text-gray-500 text-sm p-4">Loading messages…</p>

  const open     = messages.filter(m => m.status !== 'resolved')
  const resolved = messages.filter(m => m.status === 'resolved')

  function MessageCard({ m }) {
    const ts = m.createdAt?.seconds ? new Date(m.createdAt.seconds * 1000).toLocaleString() : '—'
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-gray-800">{m.username}</p>
            <p className="text-xs text-gray-500">{m.email} · {ts}</p>
          </div>
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${m.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-brand-yellow text-brand-orange'}`}>
            {m.status}
          </span>
        </div>
        <p className="text-gray-700 whitespace-pre-wrap">{m.message}</p>

        {m.replies?.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-3 text-sm">
            <p className="font-bold text-gray-500 mb-1">Previous replies:</p>
            {m.replies.map((r, i) => (
              <p key={i} className="text-gray-600 mb-1">"{r.text}" <span className="text-gray-400 text-xs">({r.repliedAt})</span></p>
            ))}
          </div>
        )}

        {m.status !== 'resolved' && !replySuccess[m.id] && (
          <div className="space-y-2 pt-1">
            <textarea
              placeholder="Write a reply…"
              rows={2}
              maxLength={2000}
              value={replyText[m.id] || ''}
              onChange={e => setReplyText(prev => ({ ...prev, [m.id]: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-brand-orange focus:outline-none text-sm resize-none"
            />
            <button
              onClick={() => handleReply(m.id)}
              disabled={replying || !replyText[m.id]?.trim()}
              className="px-4 py-2 bg-brand-orange text-white font-bold rounded-xl text-sm disabled:opacity-50 min-h-[44px]"
            >
              {replying ? 'Sending…' : 'Send Reply & Resolve'}
            </button>
          </div>
        )}
        {replySuccess[m.id] && (
          <p className="text-green-600 text-sm font-bold">✅ Reply sent — message resolved</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section>
        <h3 className="font-bold text-gray-600 uppercase text-xs tracking-wide mb-3">
          Open ({open.length})
        </h3>
        {open.length === 0
          ? <p className="text-gray-400 text-sm">No open messages.</p>
          : open.map(m => <div key={m.id} className="mb-3"><MessageCard m={m} /></div>)
        }
      </section>
      <section>
        <h3 className="font-bold text-gray-600 uppercase text-xs tracking-wide mb-3">
          Resolved ({resolved.length})
        </h3>
        {resolved.length === 0
          ? <p className="text-gray-400 text-sm">No resolved messages.</p>
          : resolved.map(m => <div key={m.id} className="mb-3 opacity-70"><MessageCard m={m} /></div>)
        }
      </section>
    </div>
  )
}
