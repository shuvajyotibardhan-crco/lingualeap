import { useState, useCallback } from 'react'
import { speak } from '../lib/tts'

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false)

  const speakText = useCallback((text, lang) => {
    const utterance = speak(text, lang)
    setIsSpeaking(true)
    utterance.onend   = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
  }, [])

  return { speak: speakText, isSpeaking }
}
