const STAR_STATES = ['☆', '★']

function Stars({ count }) {
  return (
    <div className="flex gap-0.5 text-brand-orange text-lg">
      {[1, 2, 3].map(n => (
        <span key={n}>{n <= count ? STAR_STATES[1] : STAR_STATES[0]}</span>
      ))}
    </div>
  )
}

export default function LevelCard({ level, theme, stars, unlocked, onClick }) {
  const isCompleted = stars > 0

  return (
    <button
      onClick={unlocked ? onClick : undefined}
      disabled={!unlocked}
      aria-label={`Level ${level}: ${theme}${!unlocked ? ' (locked)' : ''}`}
      className={[
        'rounded-2xl p-4 flex flex-col items-center gap-2 transition-transform min-h-[44px]',
        unlocked
          ? 'bg-white shadow-md hover:scale-105 active:scale-95 cursor-pointer'
          : 'bg-gray-200 opacity-60 cursor-not-allowed',
      ].join(' ')}
    >
      <span className="text-2xl">{unlocked ? (isCompleted ? '✅' : '🎯') : '🔒'}</span>
      <span className="text-sm font-bold text-gray-700">Level {level}</span>
      <span className="text-xs text-gray-500 text-center leading-tight">{theme}</span>
      {isCompleted && <Stars count={stars} />}
    </button>
  )
}
