import { Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import './AudioPlayer.css'

type AudioPlayerProps = {
  audioUrl?: string
  maxListenDuration?: number
  onTimeUpdate?: (timeRemaining: number) => void
  onStageComplete?: () => void
  disabled?: boolean
}

function AudioPlayer({
  audioUrl,
  maxListenDuration = 0.1,
  onTimeUpdate,
  onStageComplete,
  disabled = false,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const stageCompleteRef = useRef(false)

  const [isPlaying, setIsPlaying] = useState(false)
  const [timeLeft, setTimeLeft] =
    useState(maxListenDuration)
  const [progress, setProgress] = useState(0)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setTimeLeft(maxListenDuration)
    setProgress(0)
    setIsPlaying(false)
    setHasError(false)
    stageCompleteRef.current = false

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [audioUrl])

  useEffect(() => {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    stageCompleteRef.current = false

    if (audio.currentTime >= maxListenDuration) {
      audio.pause()
      audio.currentTime = maxListenDuration
      setIsPlaying(false)
      setTimeLeft(0)
      setProgress(100)
    } else {
      const remaining = Math.max(
        0,
        maxListenDuration - audio.currentTime,
      )

      setTimeLeft(remaining)

      const percentage =
        maxListenDuration > 0
          ? Math.min(
              100,
              (audio.currentTime /
                maxListenDuration) *
                100,
            )
          : 0

      setProgress(percentage)
    }
  }, [maxListenDuration])

  function handleAudioTimeUpdate() {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    const elapsed = audio.currentTime
    const remaining = Math.max(
      0,
      maxListenDuration - elapsed,
    )

    const percentage =
      maxListenDuration > 0
        ? Math.min(
            100,
            (elapsed /
              maxListenDuration) *
              100,
          )
        : 0

    setTimeLeft(remaining)
    setProgress(percentage)

    onTimeUpdate?.(remaining)

    if (
      elapsed >= maxListenDuration &&
      !stageCompleteRef.current
    ) {
      stageCompleteRef.current = true

      audio.pause()
      audio.currentTime =
        maxListenDuration

      setIsPlaying(false)
      setTimeLeft(0)
      setProgress(100)

      onTimeUpdate?.(0)
      onStageComplete?.()
    }
  }

  function handleAudioEnded() {
    setIsPlaying(false)

    if (!stageCompleteRef.current) {
      stageCompleteRef.current = true
      onStageComplete?.()
    }
  }

  function handleAudioError() {
    setIsPlaying(false)
    setHasError(true)
  }

  async function handlePlayPause() {
    const audio = audioRef.current

    if (!audio || disabled || hasError) {
      return
    }

    if (
      audio.currentTime >=
      maxListenDuration
    ) {
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
      console.error(
        'Unable to play audio:',
        error,
      )

      setHasError(true)
      setIsPlaying(false)
    }
  }

  function formatTime(value: number) {
    if (value < 1) {
      return `${value.toFixed(1)}s`
    }

    return `0:${String(
      Math.ceil(value),
    ).padStart(2, '0')}`
  }

  return (
    <div className="audio-player">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          onTimeUpdate={
            handleAudioTimeUpdate
          }
          onEnded={handleAudioEnded}
          onError={handleAudioError}
        />
      )}

      <button
        type="button"
        className="audio-player__button"
        onClick={handlePlayPause}
        disabled={
          !audioUrl ||
          disabled ||
          hasError ||
          timeLeft <= 0
        }
        aria-label={
          isPlaying
            ? 'Pause song'
            : 'Play song'
        }
      >
        {isPlaying ? (
          <Pause
            size={20}
            fill="currentColor"
          />
        ) : (
          <Play
            size={20}
            fill="currentColor"
          />
        )}
      </button>

      <div className="audio-player__main">
        <div className="audio-player__waveform">
          {Array.from({
            length: 32,
          }).map((_, index) => (
            <span
              key={index}
              className={
                isPlaying
                  ? 'is-playing'
                  : ''
              }
              style={{
                animationDelay: `${
                  index * 35
                }ms`,
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
        {hasError
          ? 'ERROR'
          : formatTime(timeLeft)}
      </div>
    </div>
  )
}

export default AudioPlayer
