import { Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import './AudioPlayer.css'

type AudioPlayerProps = {
  audioUrl?: string
  maxListenDuration?: number
  onTimeUpdate?: (timeRemaining: number) => void
  onStageComplete?: () => void
  disabled?: boolean
  playFullSong?: boolean
}

function AudioPlayer({
  audioUrl,
  maxListenDuration = 0.1,
  onTimeUpdate,
  onStageComplete,
  disabled = false,
  playFullSong = false,
}: AudioPlayerProps) {
  const audioRef =
    useRef<HTMLAudioElement | null>(null)

  const stageCompleteRef =
    useRef(false)

  const [isPlaying, setIsPlaying] =
    useState(false)

  const [timeLeft, setTimeLeft] =
    useState(maxListenDuration)

  const [progress, setProgress] =
    useState(0)

  const [hasError, setHasError] =
    useState(false)

  /*
   * Reset everything when the song changes.
   */
  useEffect(() => {
    const audio = audioRef.current

    setIsPlaying(false)
    setTimeLeft(maxListenDuration)
    setProgress(0)
    setHasError(false)

    stageCompleteRef.current = false

    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
  }, [audioUrl])

  /*
   * Reset playback whenever a new listening stage
   * is unlocked.
   */
  useEffect(() => {
    const audio = audioRef.current

    if (
      !audio ||
      disabled ||
      hasError ||
      playFullSong
    ) {
      return
    }

    audio.pause()
    audio.currentTime = 0

    stageCompleteRef.current = false

    setIsPlaying(false)
    setTimeLeft(maxListenDuration)
    setProgress(0)

    onTimeUpdate?.(maxListenDuration)
  }, [
    maxListenDuration,
    disabled,
    hasError,
    playFullSong,
  ])

  /*
   * When the answer is revealed, allow the
   * complete preview to continue playing.
   */
  useEffect(() => {
    const audio = audioRef.current

    if (
      !audio ||
      !playFullSong ||
      hasError
    ) {
      return
    }

    stageCompleteRef.current = true

    /*
     * If the player reveals the answer before
     * the current stage has finished, continue
     * from the current position.
     *
     * If the stage already reset to 0, start
     * from the beginning of the preview.
     */
    if (
      audio.currentTime === 0
    ) {
      audio.currentTime = 0
    }

    audio.play()
      .then(() => {
        setIsPlaying(true)
      })
      .catch((error) => {
        console.error(
          'Unable to continue full song:',
          error,
        )
      })
  }, [
    playFullSong,
    hasError,
  ])

  function handleAudioTimeUpdate() {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    /*
     * Once the answer is revealed, the listening
     * limit no longer applies.
     */
    if (playFullSong) {
      setIsPlaying(!audio.paused)
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

      audio.currentTime = 0

      setIsPlaying(false)
      setTimeLeft(0)
      setProgress(100)

      onTimeUpdate?.(0)
      onStageComplete?.()
    }
  }

  function handleAudioEnded() {
    setIsPlaying(false)

    if (stageCompleteRef.current) {
      return
    }

    stageCompleteRef.current = true

    setTimeLeft(0)
    setProgress(100)

    onTimeUpdate?.(0)
    onStageComplete?.()
  }

  function handleAudioError() {
    setIsPlaying(false)
    setHasError(true)
  }

  async function handlePlayPause() {
    const audio = audioRef.current

    if (
      !audio ||
      hasError
    ) {
      return
    }

    /*
     * Once the answer is revealed, the player
     * remains usable for the full preview.
     */
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      return
    }

    /*
     * Normal game playback.
     */
    if (!playFullSong) {
      if (disabled) {
        return
      }

      if (stageCompleteRef.current) {
        audio.currentTime = 0

        stageCompleteRef.current = false

        setTimeLeft(maxListenDuration)
        setProgress(0)

        onTimeUpdate?.(
          maxListenDuration,
        )
      }
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
          (!playFullSong &&
            disabled) ||
          hasError
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
          : playFullSong
            ? 'PLAYING'
            : formatTime(timeLeft)}
      </div>
    </div>
  )
}

export default AudioPlayer
