import { useState, useCallback } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../lib/firebase'

export function useCallable(name) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const call = useCallback(async (payload) => {
    setLoading(true)
    setError(null)
    try {
      const fn = httpsCallable(functions, name)
      const result = await fn(payload)
      return result.data
    } catch (err) {
      const msg = err.message || 'Something went wrong — please try again'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [name])

  return { call, loading, error }
}
