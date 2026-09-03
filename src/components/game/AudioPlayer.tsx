import { Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import './AudioPlayer.css'

type AudioPlayerProps = {
  audioUrl?: string
  duration?: number
  onTimeUpdate?: (timeRemaining: number) => void
  onComplete?: () => void
}

function AudioPlayer({
  audioUrl,
  duration = 10,
  onTimeUpdate,
  onComplete,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [timeLeft, setTimeLeft] = useState(duration)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setTimeLeft(duration)
    setProgress(0)
    setIsPlaying(false)

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [duration, audioUrl])

  function handleAudioTimeUpdate() {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    const elapsed = audio.currentTime
    const remaining = Math.max(0, duration - elapsed)
    const percentage = Math.min(100, (elapsed / duration) * 100)

    setTimeLeft(Math.ceil(remaining))
    setProgress(percentage)

    onTimeUpdate?.(Math.ceil(remaining))

    if (remaining <= 0) {
      audio.pause()
      setIsPlaying(false)
      setTimeLeft(0)
      setProgress(100)
      onTimeUpdate?.(0)
      onComplete?.()
    }
  }

  function handleAudioEnded() {
    setIsPlaying(false)
    setTimeLeft(0)
    setProgress(100)
    onTimeUpdate?.(0)
    onComplete?.()
  }

  async function handlePlayPause() {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    if (timeLeft <= 0) {
      return
    }

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      return
    }

    try {
      await audio.play()
      setIsPlaying(true)
    } catch (error) {
      console.error('Unable to play audio:', error)
    }
  }

  return (
    <div className="audio-player">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleAudioTimeUpdate}
          onEnded={handleAudioEnded}
        />
      )}

      <button
        type="button"
        className="audio-player__button"
        onClick={handlePlayPause}
        disabled={!audioUrl}
        aria-label={isPlaying ? 'Pause song' : 'Play song'}
      >
        {isPlaying ? (
          <Pause size={20} fill="currentColor" />
        ) : (
          <Play size={20} fill="currentColor" />
        )}
      </button>

      <div className="audio-player__main">
        <div className="audio-player__waveform">
          {Array.from({ length: 32 }).map((_, index) => (
            <span
              key={index}
              className={isPlaying ? 'is-playing' : ''}
              style={{
                animationDelay: `${index * 35}ms`,
              }}
            />
          ))}
        </div>

        <div className="audio-player__progress">
          <div
            className="audio-player__progress-bar"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>

      <div className="audio-player__timer">
        0:{String(timeLeft).padStart(2, '0')}
      </div>
    </div>
  )
}

export default AudioPlayer