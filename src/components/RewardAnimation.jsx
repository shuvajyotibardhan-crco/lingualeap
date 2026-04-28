import { useEffect } from 'react'

export default function RewardAnimation({ stars, badge, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50 animate-fade-in">
      <div className="bg-white rounded-3xl p-8 flex flex-col items-center gap-4 shadow-xl">
        <div className="text-6xl animate-bounce">
          {stars === 3 ? '🏆' : stars === 2 ? '🌟' : '⭐'}
        </div>
        <p className="text-2xl font-bold text-gray-800">
          {stars === 3 ? 'Perfect!' : stars === 2 ? 'Great job!' : 'Level done!'}
        </p>
        <div className="flex gap-1 text-3xl text-brand-orange">
          {[1, 2, 3].map(n => (
            <span key={n}>{n <= stars ? '★' : '☆'}</span>
          ))}
        </div>
        {badge && (
          <p className="text-sm font-semibold text-brand-orange">
            🏅 Badge unlocked: {badge}
          </p>
        )}
      </div>
    </div>
  )
}
