import { Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import './AudioPlayer.css'

type AudioPlayerProps = {
  audioUrl?: string
  duration?: number
  onComplete?: () => void
}

function AudioPlayer({
  audioUrl,
  duration = 10,
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
  }, [duration, audioUrl])

  useEffect(() => {
    if (!isPlaying) {
      return
    }

    const interval = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(interval)
          setIsPlaying(false)
          setProgress(100)
          onComplete?.()
          return 0
        }

        return current - 1
      })

      setProgress((current) =>
        Math.min(
          100,
          current + (100 / duration),
        ),
      )
    }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [isPlaying, duration, onComplete])

  async function handlePlayPause() {
    if (timeLeft <= 0) {
      setTimeLeft(duration)
      setProgress(0)
    }

    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        await audioRef.current.play()
      }
    }

    setIsPlaying((current) => !current)
  }

  return (
    <div className="audio-player">

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => {
            setIsPlaying(false)
            setTimeLeft(0)
            setProgress(100)
            onComplete?.()
          }}
        />
      )}

      <button
        type="button"
        disabled={!audioUrl}
        className="audio-player__button"
        onClick={handlePlayPause}
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