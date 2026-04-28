const SpeechRecognition =
  typeof window !== 'undefined' &&
  (window.SpeechRecognition || window.webkitSpeechRecognition)

export const isASRSupported = Boolean(SpeechRecognition)

export function createRecogniser(lang = 'es-ES') {
  if (!SpeechRecognition) return null
  const rec        = new SpeechRecognition()
  rec.lang         = lang
  rec.continuous   = false
  rec.interimResults = false
  rec.maxAlternatives = 1
  return rec
}
