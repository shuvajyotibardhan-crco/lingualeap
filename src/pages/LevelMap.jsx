import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'

export default function LevelMap() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-yellow px-4 gap-4">
      <div className="text-6xl">🦜</div>
      <h1 className="text-3xl font-display font-extrabold text-brand-orange">LinguaLeap</h1>
      <p className="font-display text-gray-700">Welcome, {user?.displayName || 'Explorer'}!</p>
      <p className="font-display text-gray-500 text-sm">Level Map coming soon...</p>
      <button
        onClick={() => signOut(auth)}
        className="mt-4 px-6 py-2 bg-white rounded-xl font-display font-bold text-gray-600 hover:bg-gray-50 border-2 border-gray-200 min-h-[44px]"
      >
        Sign out
      </button>
    </div>
  )
}
