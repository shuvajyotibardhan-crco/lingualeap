import { useState, useEffect } from 'react'

export function useLevelData(level) {
  const [phrases, setPhrases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!level) return
    let cancelled = false

    setLoading(true)
    setError(null)

    fetch(`/data/es/level_${level}.json`)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load level ${level}`)
        return res.json()
      })
      .then(data => {
        if (!cancelled) {
          setPhrases(data)
          setLoading(false)
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [level])

  return { phrases, loading, error }
}
