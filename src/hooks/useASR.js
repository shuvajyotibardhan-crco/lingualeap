import { useState, useRef, useCallback } from 'react'
import { createRecogniser, isASRSupported } from '../lib/asr'

export function useASR(lang = 'es-ES') {
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const recRef = useRef(null)

  const startListening = useCallback(() => {
    const rec = createRecogniser(lang)
    if (!rec) return
    recRef.current = rec
    setTranscript('')
    setIsListening(true)

    rec.onresult = e => {
      setTranscript(e.results[0][0].transcript)
    }
    rec.onend  = () => setIsListening(false)
    rec.onerror = () => setIsListening(false)
    rec.start()
  }, [lang])

  const stopListening = useCallback(() => {
    recRef.current?.stop()
  }, [])

  return { startListening, stopListening, transcript, isListening, isSupported: isASRSupported }
}
