import {
  Pause,
  Play,
} from 'lucide-react'

import {
  useEffect,
  useRef,
  useState,
} from 'react'

import './AudioPlayer.css'

type AudioPlayerProps = {
  audioUrl?: string
  maxListenDuration?: number
  onTimeUpdate?: (
    timeRemaining: number,
  ) => void
  onStageComplete?: () => void
  onPreviewComplete?: () => void
  disabled?: boolean
  playFullSong?: boolean
}

function AudioPlayer({
  audioUrl,
  maxListenDuration = 0.1,
  onTimeUpdate,
  onStageComplete,
  onPreviewComplete,
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

  const [previewDuration, setPreviewDuration] =
    useState(0)

  /*
   * Reset everything when the song changes.
   */
  useEffect(() => {
    const audio =
      audioRef.current

    setIsPlaying(false)
    setTimeLeft(maxListenDuration)
    setProgress(0)
    setHasError(false)
    setPreviewDuration(0)

    stageCompleteRef.current = false

    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
  }, [audioUrl])

  /*
   * When a new listening stage is unlocked,
   * restart the song from the beginning.
   *
   * This is intentional:
   *
   * 0.1s → replay from 0 for 0.5s
   * 0.5s → replay from 0 for 2s
   * etc.
   */
  useEffect(() => {
    const audio =
      audioRef.current

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

    onTimeUpdate?.(
      maxListenDuration,
    )
  }, [
    maxListenDuration,
    disabled,
    hasError,
    playFullSong,
  ])

  /*
   * When the answer is revealed,
   * switch from stage mode into full-preview mode.
   *
   * IMPORTANT:
   * We do NOT reset currentTime here.
   *
   * So if the player had listened to 2 seconds,
   * the reveal continues from 2 seconds.
   */
  useEffect(() => {
    const audio =
      audioRef.current

    if (
      !audio ||
      !playFullSong ||
      hasError
    ) {
      return
    }

    /*
     * Make sure we know the total preview
     * duration once the browser has loaded it.
     */
    if (
      Number.isFinite(audio.duration) &&
      audio.duration > 0
    ) {
      setPreviewDuration(
        audio.duration,
      )
    }

    /*
     * Continue playing from the current
     * position.
     */
    audio
      .play()
      .then(() => {
        setIsPlaying(true)
      })
      .catch((error) => {
        console.error(
          'Unable to continue preview:',
          error,
        )
      })
  }, [
    playFullSong,
    hasError,
  ])

  /*
   * Get the full preview duration.
   */
  function handleLoadedMetadata() {
    const audio =
      audioRef.current

    if (!audio) {
      return
    }

    if (
      Number.isFinite(audio.duration) &&
      audio.duration > 0
    ) {
      setPreviewDuration(
        audio.duration,
      )
    }
  }

  /*
   * Handle playback progress.
   */
  function handleAudioTimeUpdate() {
    const audio =
      audioRef.current

    if (!audio) {
      return
    }

    /*
     * FULL PREVIEW MODE
     *
     * No listening-stage limit.
     */
    if (playFullSong) {
      const duration =
        audio.duration

      if (
        Number.isFinite(duration) &&
        duration > 0
      ) {
        const percentage =
          Math.min(
            100,
            (audio.currentTime /
              duration) *
              100,
          )

        const remaining =
          Math.max(
            0,
            duration -
              audio.currentTime,
          )

        setPreviewDuration(
          duration,
        )

        setProgress(
          percentage,
        )

        setTimeLeft(
          remaining,
        )
      }

      setIsPlaying(
        !audio.paused,
      )

      return
    }

    /*
     * NORMAL LISTENING MODE
     */
    const elapsed =
      audio.currentTime

    const remaining =
      Math.max(
        0,
        maxListenDuration -
          elapsed,
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

    setTimeLeft(
      remaining,
    )

    setProgress(
      percentage,
    )

    onTimeUpdate?.(
      remaining,
    )

    /*
     * Stage reached.
     *
     * IMPORTANT:
     * Do NOT reset currentTime.
     */
    if (
      elapsed >=
        maxListenDuration &&
      !stageCompleteRef.current
    ) {
      stageCompleteRef.current =
        true

      audio.pause()

      setIsPlaying(false)
      setTimeLeft(0)
      setProgress(100)

      onTimeUpdate?.(0)
      onStageComplete?.()
    }
  }

  /*
   * Audio reached its actual end.
   */
  function handleAudioEnded() {
    setIsPlaying(false)

    /*
     * If we are playing the complete preview,
     * notify Game.tsx that the player can now
     * move to the next song.
     */
    if (playFullSong) {
      setProgress(100)
      setTimeLeft(0)

      onTimeUpdate?.(0)
      onPreviewComplete?.()

      return
    }

    /*
     * Normal stage playback.
     */
    if (stageCompleteRef.current) {
      return
    }

    stageCompleteRef.current =
      true

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
    const audio =
      audioRef.current

    if (
      !audio ||
      hasError
    ) {
      return
    }

    /*
     * Pause.
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

      /*
       * If the stage was already completed,
       * replay that stage from the beginning.
       */
      if (
        stageCompleteRef.current
      ) {
        audio.currentTime = 0

        stageCompleteRef.current =
          false

        setTimeLeft(
          maxListenDuration,
        )

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

  function formatTime(
    value: number,
  ) {
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
          onLoadedMetadata={
            handleLoadedMetadata
          }
          onTimeUpdate={
            handleAudioTimeUpdate
          }
          onEnded={
            handleAudioEnded
          }
          onError={
            handleAudioError
          }
        />
      )}

      <button
        type="button"
        className="audio-player__button"
        onClick={
          handlePlayPause
        }
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
            ? previewDuration > 0
              ? formatTime(
                  timeLeft,
                )
              : 'PLAYING'
            : formatTime(
                timeLeft,
              )}
      </div>
    </div>
  )
}

export default AudioPlayer