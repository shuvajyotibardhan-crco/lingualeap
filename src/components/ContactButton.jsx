import { useState } from 'react'
import { Mail } from 'lucide-react'
import ContactModal from './ContactModal'
import { useAuth } from '../context/AuthContext'
import { useProgress } from '../hooks/useProgress'

export default function ContactButton() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const { progress } = useProgress()

  const prefillUsername = progress?.username || user?.displayName || ''
  const prefillEmail    = progress?.email    || user?.email       || ''

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Contact support"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-brand-yellow shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        <Mail size={24} className="text-brand-orange" />
      </button>
      <ContactModal
        isOpen={open}
        onClose={() => setOpen(false)}
        prefillUsername={prefillUsername}
        prefillEmail={prefillEmail}
        isLoggedIn={!!user}
      />
    </>
  )
}
