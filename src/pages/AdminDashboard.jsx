import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import UsersTab    from '../admin/UsersTab'
import MessagesTab from '../admin/MessagesTab'
import SettingsTab from '../admin/SettingsTab'

const TABS = [
  { id: 'users',    label: '👥 Users'    },
  { id: 'messages', label: '📬 Messages' },
  { id: 'settings', label: '⚙️ Settings' },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('users')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-brand-orange shadow px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-xs text-white/70">LinguaLeap</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="text-sm text-white/80 hover:text-white underline min-h-[44px] px-2"
        >
          ← App
        </button>
      </header>

      <div className="sticky top-[60px] z-10 bg-white border-b border-gray-200 flex">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-sm font-bold transition-colors min-h-[44px] ${
              activeTab === tab.id
                ? 'text-brand-orange border-b-2 border-brand-orange'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {activeTab === 'users'    && <UsersTab />}
        {activeTab === 'messages' && <MessagesTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>
    </div>
  )
}
