export const DEFAULT_LANG  = 'es'
export const TTS_LANG_HINT = 'es-ES'

function selectVoice(lang) {
  const voices = speechSynthesis.getVoices()
  return (
    voices.find(v => v.lang.startsWith(lang + '-')) ||
    voices.find(v => v.lang.startsWith(lang)) ||
    null
  )
}

export function speak(text, lang = DEFAULT_LANG) {
  speechSynthesis.cancel()
  const utterance   = new SpeechSynthesisUtterance(text)
  utterance.voice   = selectVoice(lang)
  utterance.lang    = TTS_LANG_HINT
  speechSynthesis.speak(utterance)
  return utterance
}
