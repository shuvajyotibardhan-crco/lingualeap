import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth'
import { auth } from '../lib/firebase'

const FIREBASE_ERRORS = {
  'auth/email-already-in-use': 'An account with this email already exists',
  'auth/invalid-email':        'Please enter a valid email',
  'auth/weak-password':        'Password must be at least 8 characters',
}

const googleProvider = new GoogleAuthProvider()

export default function RegisterPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors]     = useState({})
  const [busy, setBusy]         = useState(false)

  function validate() {
    const e = {}
    if (!username.trim()) e.username = 'Please enter a name'
    if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Please enter a valid email'
    if (password.length < 8) e.password = 'Password must be at least 8 characters'
    return e
  }

  async function handleRegister(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setBusy(true)
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(user, { displayName: username.trim() })
      navigate('/')
    } catch (err) {
      const msg = FIREBASE_ERRORS[err.code] ?? 'Something went wrong — please try again'
      setErrors({ form: msg })
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogle() {
    setErrors({})
    setBusy(true)
    try {
      await signInWithPopup(auth, googleProvider)
      navigate('/')
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrors({ form: 'Something went wrong — please try again' })
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-yellow px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-2">🦜</div>
          <h1 className="text-3xl font-display font-extrabold text-brand-orange">LinguaLeap</h1>
          <p className="text-gray-600 mt-1 font-display">Start your language adventure!</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-display font-bold text-gray-700 mb-1">Your name</label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. Sofia"
                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none font-display text-gray-800 text-base transition-colors ${errors.username ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-brand-orange'}`}
              />
              {errors.username && <p role="alert" className="text-red-500 text-xs font-display mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-display font-bold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none font-display text-gray-800 text-base transition-colors ${errors.email ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-brand-orange'}`}
              />
              {errors.email && <p role="alert" className="text-red-500 text-xs font-display mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-display font-bold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none font-display text-gray-800 text-base transition-colors ${errors.password ? 'border-red-400 focus:border-red-400' : 'border-gray-200 focus:border-brand-orange'}`}
              />
              {errors.password && <p role="alert" className="text-red-500 text-xs font-display mt-1">{errors.password}</p>}
            </div>

            {errors.form && (
              <p role="alert" className="text-red-500 text-sm font-display bg-red-50 rounded-xl px-4 py-2">
                {errors.form}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 bg-brand-green text-white font-display font-extrabold text-lg rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 min-h-[44px]"
            >
              {busy ? '...' : 'Create Account'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-sm font-display">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            onClick={handleGoogle}
            disabled={busy}
            className="w-full py-3 bg-white border-2 border-gray-200 text-gray-700 font-display font-bold text-base rounded-xl hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-3 min-h-[44px] disabled:opacity-50"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </div>

        <p className="text-center mt-6 font-display text-gray-700">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-orange font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}
