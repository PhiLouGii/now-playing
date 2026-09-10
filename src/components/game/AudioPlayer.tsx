import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

import './AudioPlayer.css'

export type AudioPlayerHandle = {
  playPreview: () => Promise<void>
}

interface AudioPlayerProps {
  audioUrl: string
  maxListenDuration: number
  onTimeUpdate: (time: number) => void
  onStageComplete: () => void
  onPreviewComplete?: () => void
  disabled?: boolean
  playFullSong?: boolean
}

const WAVEFORM_BARS = [
  28, 44, 64, 38, 76, 52, 88, 42, 68, 94,
  58, 36, 82, 48, 72, 100, 54, 40, 78, 62,
  92, 46, 70, 34, 84, 56, 74, 44, 96, 60,
  38, 68, 86, 50, 78, 42, 90, 64, 48, 72,
]

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const AudioPlayer = forwardRef<AudioPlayerHandle, AudioPlayerProps>(
  (
    {
      audioUrl,
      maxListenDuration,
      onTimeUpdate,
      onStageComplete,
      onPreviewComplete,
      disabled = false,
      playFullSong = false,
    },
    ref,
  ) => {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const isFullPreviewRef = useRef(playFullSong)
    const stageCompleteRef = useRef(false)
    const previewCompleteRef = useRef(false)

    const [isPlaying, setIsPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [timeLeft, setTimeLeft] = useState(maxListenDuration)
    const [hasError, setHasError] = useState(false)

    /*
     * Keep the ref synchronized with the current mode.
     *
     * The important part is that playPreview() also sets this ref
     * immediately, so the player can switch to full-preview mode
     * without waiting for React to re-render.
     */
    useEffect(() => {
      isFullPreviewRef.current = playFullSong

      if (playFullSong) {
        stageCompleteRef.current = false
      }
    }, [playFullSong])

    /*
     * New song.
     */
    useEffect(() => {
      const audio = audioRef.current

      if (!audio) return

      audio.pause()
      audio.currentTime = 0

      isFullPreviewRef.current = false
      stageCompleteRef.current = false
      previewCompleteRef.current = false

      setIsPlaying(false)
      setProgress(0)
      setCurrentTime(0)
      setDuration(0)
      setTimeLeft(maxListenDuration)
      setHasError(false)

      onTimeUpdate(0)
    }, [audioUrl])

    /*
     * Listening stage changed.
     *
     * Every stage starts from 0:00:
     * 0.1 → 0:00–0.1
     * 0.5 → 0:00–0.5
     * 2   → 0:00–2
     * 8   → 0:00–8
     * 15  → 0:00–15
     */
    useEffect(() => {
      const audio = audioRef.current

      if (!audio || isFullPreviewRef.current) return

      audio.pause()
      audio.currentTime = 0

      stageCompleteRef.current = false

      setIsPlaying(false)
      setProgress(0)
      setCurrentTime(0)
      setTimeLeft(maxListenDuration)

      onTimeUpdate(0)
    }, [maxListenDuration])

    /*
     * Play the complete available Deezer preview.
     */
    async function playPreview() {
      const audio = audioRef.current

      if (!audio || hasError) return

      isFullPreviewRef.current = true
      stageCompleteRef.current = false
      previewCompleteRef.current = false

      audio.currentTime = 0

      setCurrentTime(0)
      setProgress(0)

      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration)
        setTimeLeft(audio.duration)
      }

      try {
        await audio.play()
        setIsPlaying(true)
      } catch (error) {
        console.error('Unable to play preview:', error)
        setIsPlaying(false)
      }
    }

    useImperativeHandle(
      ref,
      () => ({
        playPreview,
      }),
      [hasError],
    )

    /*
     * Audio time updates.
     */
    function handleAudioTimeUpdate() {
      const audio = audioRef.current

      if (!audio) return

      const current = audio.currentTime || 0

      /*
       * FULL PREVIEW MODE
       */
      if (isFullPreviewRef.current) {
        const fullDuration =
          Number.isFinite(audio.duration) && audio.duration > 0
            ? audio.duration
            : 30

        const percentage = Math.min(
          (current / fullDuration) * 100,
          100,
        )

        setCurrentTime(current)
        setDuration(fullDuration)
        setProgress(percentage)
        setTimeLeft(Math.max(fullDuration - current, 0))

        return
      }

      /*
       * STAGE MODE
       */
      const percentage =
        maxListenDuration > 0
          ? Math.min((current / maxListenDuration) * 100, 100)
          : 0

      const remaining = Math.max(
        maxListenDuration - current,
        0,
      )

      setCurrentTime(current)
      setProgress(percentage)
      setTimeLeft(remaining)

      onTimeUpdate(current)

      /*
       * Stop exactly at the stage limit.
       */
      if (
        current >= maxListenDuration &&
        !stageCompleteRef.current
      ) {
        stageCompleteRef.current = true

        audio.pause()
        audio.currentTime = maxListenDuration

        setCurrentTime(maxListenDuration)
        setProgress(100)
        setTimeLeft(0)
        setIsPlaying(false)

        onStageComplete()
      }
    }

    /*
     * Audio naturally reached the end.
     */
    function handleAudioEnded() {
      const audio = audioRef.current

      if (!audio) return

      setIsPlaying(false)

      if (isFullPreviewRef.current) {
        previewCompleteRef.current = true

        setCurrentTime(audio.duration || currentTime)
        setProgress(100)
        setTimeLeft(0)

        onPreviewComplete?.()
        return
      }

      if (!stageCompleteRef.current) {
        stageCompleteRef.current = true

        setProgress(100)
        setTimeLeft(0)

        onStageComplete()
      }
    }

    async function handlePlayPause() {
      const audio = audioRef.current

      if (!audio || disabled || hasError) return

      /*
       * Full preview.
       */
      if (isFullPreviewRef.current) {
        if (audio.paused) {
          try {
            await audio.play()
            setIsPlaying(true)
          } catch (error) {
            console.error('Unable to resume preview:', error)
          }
        } else {
          audio.pause()
          setIsPlaying(false)
        }

        return
      }

      /*
       * Stage has already completed.
       * Pressing play starts the current stage again.
       */
      if (stageCompleteRef.current) {
        audio.currentTime = 0
        stageCompleteRef.current = false

        setCurrentTime(0)
        setProgress(0)
        setTimeLeft(maxListenDuration)

        onTimeUpdate(0)
      }

      if (audio.paused) {
        try {
          await audio.play()
          setIsPlaying(true)
        } catch (error) {
          console.error('Unable to play audio:', error)
        }
      } else {
        audio.pause()
        setIsPlaying(false)
      }
    }

    function handleLoadedMetadata() {
      const audio = audioRef.current

      if (!audio) return

      const loadedDuration = audio.duration

      if (Number.isFinite(loadedDuration) && loadedDuration > 0) {
        setDuration(loadedDuration)

        if (isFullPreviewRef.current) {
          setTimeLeft(loadedDuration)
        }
      }
    }

    function handleAudioError() {
      setHasError(true)
      setIsPlaying(false)
    }

    /*
     * Which time should be shown depends on the mode.
     */
    const displayDuration = isFullPreviewRef.current
      ? duration
      : maxListenDuration

    const stageLabel = isFullPreviewRef.current
      ? 'FULL PREVIEW'
      : `${maxListenDuration}s LISTEN`

    return (
      <div
        className={[
          'audio-player',
          isPlaying ? 'audio-player--playing' : '',
          isFullPreviewRef.current
            ? 'audio-player--full'
            : '',
          disabled ? 'audio-player--disabled' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          onTimeUpdate={handleAudioTimeUpdate}
          onEnded={handleAudioEnded}
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleAudioError}
        />

        <div className="audio-player__top">
          <span className="audio-player__label">
            {isPlaying ? 'NOW PLAYING' : 'READY TO PLAY'}
          </span>

          <span className="audio-player__stage">
            {stageLabel}
          </span>
        </div>

        <div className="audio-player__main">
          <button
            type="button"
            className="audio-player__play"
            onClick={handlePlayPause}
            disabled={disabled || hasError}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            <span
              className={
                isPlaying
                  ? 'audio-player__pause-icon'
                  : 'audio-player__play-icon'
              }
            />
          </button>

          <div className="audio-player__wave">
            {WAVEFORM_BARS.map((height, index) => {
              const barProgress =
                (index / WAVEFORM_BARS.length) * 100

              const active = progress >= barProgress

              return (
                <span
                  key={index}
                  className={[
                    'audio-player__bar',
                    active
                      ? 'audio-player__bar--active'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{
                    height: `${height}%`,
                    animationDelay: `${index * 0.035}s`,
                  }}
                />
              )
            })}
          </div>
        </div>

        <div className="audio-player__bottom">
          <span>{formatTime(currentTime)}</span>

          <div className="audio-player__track">
            <div
              className="audio-player__track-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <span>
            {formatTime(
              isFullPreviewRef.current
                ? displayDuration
                : timeLeft,
            )}
          </span>
        </div>

        {hasError && (
          <div className="audio-player__error">
            AUDIO PREVIEW UNAVAILABLE
          </div>
        )}
      </div>
    )
  },
)

AudioPlayer.displayName = 'AudioPlayer'

export default AudioPlayer
