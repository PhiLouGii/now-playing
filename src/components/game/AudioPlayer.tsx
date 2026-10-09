
import {
  forwardRef,
  useCallback,
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
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00'
  }

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

    // Keep callbacks current without making playback effects rerun.
    const callbacksRef = useRef({
      onTimeUpdate,
      onStageComplete,
      onPreviewComplete,
    })

    callbacksRef.current = {
      onTimeUpdate,
      onStageComplete,
      onPreviewComplete,
    }

    const fullPreviewRef = useRef(playFullSong)
    const stageCompleteRef = useRef(false)
    const previewCompleteRef = useRef(false)
    const playRequestRef = useRef(0)

    const [isPlaying, setIsPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [timeLeft, setTimeLeft] = useState(maxListenDuration)
    const [hasError, setHasError] = useState(false)

    const hasAudioUrl =
      typeof audioUrl === 'string' && audioUrl.trim().length > 0

    const stopAudio = useCallback(() => {
      playRequestRef.current += 1

      const audio = audioRef.current

      if (audio) {
        audio.pause()
      }

      setIsPlaying(false)
    }, [])

    const startPlayback = useCallback(async () => {
      const audio = audioRef.current

      if (
        !audio ||
        !hasAudioUrl ||
        hasError ||
        disabled
      ) {
        return
      }

      const requestId = ++playRequestRef.current

      try {
        await audio.play()

        if (requestId !== playRequestRef.current) {
          return
        }

        setIsPlaying(!audio.paused)
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === 'AbortError'
        ) {
          return
        }

        console.error('Unable to play audio:', error)
        setIsPlaying(false)
      }
    }, [hasAudioUrl, hasError, disabled])

    // Reset playback only when the actual song/source changes.
    // Callback identity changes and stage updates cannot trigger this.
    useEffect(() => {
      const audio = audioRef.current

      playRequestRef.current += 1

      if (audio) {
        audio.pause()
        audio.currentTime = 0

        if (!hasAudioUrl) {
          audio.removeAttribute('src')
          audio.load()
        }
      }

      fullPreviewRef.current = playFullSong
      stageCompleteRef.current = false
      previewCompleteRef.current = false

      setIsPlaying(false)
      setProgress(0)
      setCurrentTime(0)
      setDuration(0)
      setTimeLeft(maxListenDuration)
      setHasError(!hasAudioUrl)

      callbacksRef.current.onTimeUpdate(0)
      // Intentionally reset only when the source changes.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioUrl, hasAudioUrl])

    // A longer listening stage gets its own fresh attempt.
    // This effect does not depend on parent callback identities.
    useEffect(() => {
      const audio = audioRef.current

      if (!audio || fullPreviewRef.current) {
        return
      }

      playRequestRef.current += 1
      audio.pause()
      audio.currentTime = 0

      stageCompleteRef.current = false

      setIsPlaying(false)
      setProgress(0)
      setCurrentTime(0)
      setTimeLeft(maxListenDuration)

      callbacksRef.current.onTimeUpdate(0)
    }, [maxListenDuration])

    // Update the mode without resetting the source or pausing audio.
    useEffect(() => {
      fullPreviewRef.current = playFullSong

      if (playFullSong) {
        stageCompleteRef.current = false
      }
    }, [playFullSong])

    const playPreview = useCallback(async () => {
      const audio = audioRef.current

      if (
        !audio ||
        !hasAudioUrl ||
        hasError ||
        disabled
      ) {
        return
      }

      fullPreviewRef.current = true
      stageCompleteRef.current = false
      previewCompleteRef.current = false

      audio.currentTime = 0

      setCurrentTime(0)
      setProgress(0)
      setTimeLeft(
        Number.isFinite(audio.duration) && audio.duration > 0
          ? audio.duration
          : maxListenDuration,
      )

      await startPlayback()
    }, [
      hasAudioUrl,
      hasError,
      disabled,
      maxListenDuration,
      startPlayback,
    ])

    useImperativeHandle(
      ref,
      () => ({ playPreview }),
      [playPreview],
    )

    function handleAudioTimeUpdate() {
      const audio = audioRef.current

      if (!audio) {
        return
      }

      const current = audio.currentTime || 0

      if (fullPreviewRef.current) {
        const fullDuration =
          Number.isFinite(audio.duration) && audio.duration > 0
            ? audio.duration
            : 30

        setCurrentTime(current)
        setDuration(fullDuration)
        setProgress(Math.min((current / fullDuration) * 100, 100))
        setTimeLeft(Math.max(fullDuration - current, 0))

        callbacksRef.current.onTimeUpdate(current)
        return
      }

      const stageDuration = Math.max(maxListenDuration, 0)
      const remaining = Math.max(stageDuration - current, 0)

      setCurrentTime(current)
      setProgress(
        stageDuration > 0
          ? Math.min((current / stageDuration) * 100, 100)
          : 0,
      )
      setTimeLeft(remaining)

      callbacksRef.current.onTimeUpdate(current)

      if (
        stageDuration > 0 &&
        current >= stageDuration &&
        !stageCompleteRef.current
      ) {
        stageCompleteRef.current = true

        // Pause only after the selected listening duration is reached.
        stopAudio()

        audio.currentTime = stageDuration

        setCurrentTime(stageDuration)
        setProgress(100)
        setTimeLeft(0)

        callbacksRef.current.onStageComplete()
      }
    }

    function handleAudioEnded() {
      const audio = audioRef.current

      setIsPlaying(false)

      if (fullPreviewRef.current) {
        if (previewCompleteRef.current) {
          return
        }

        previewCompleteRef.current = true

        const finalTime = audio?.duration || currentTime

        setCurrentTime(finalTime)
        setProgress(100)
        setTimeLeft(0)

        callbacksRef.current.onPreviewComplete?.()
        return
      }

      if (!stageCompleteRef.current) {
        stageCompleteRef.current = true
        setProgress(100)
        setTimeLeft(0)

        callbacksRef.current.onStageComplete()
      }
    }

    async function handlePlayPause() {
      const audio = audioRef.current

      if (
        !audio ||
        disabled ||
        !hasAudioUrl ||
        hasError
      ) {
        return
      }

      if (!audio.paused) {
        stopAudio()
        return
      }

      if (stageCompleteRef.current && !fullPreviewRef.current) {
        audio.currentTime = 0
        stageCompleteRef.current = false

        setCurrentTime(0)
        setProgress(0)
        setTimeLeft(maxListenDuration)

        callbacksRef.current.onTimeUpdate(0)
      }

      await startPlayback()
    }

    function handleLoadedMetadata() {
      const audio = audioRef.current

      if (!audio) {
        return
      }

      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration)

        if (fullPreviewRef.current) {
          setTimeLeft(
            Math.max(audio.duration - audio.currentTime, 0),
          )
        }
      }

      setHasError(false)
    }

    function handleAudioError() {
      const audio = audioRef.current

      if (!hasAudioUrl || !audio?.getAttribute('src')) {
        return
      }

      setHasError(true)
      setIsPlaying(false)
    }

    function handleCanPlay() {
      setHasError(false)
    }

    const displayDuration = fullPreviewRef.current
      ? duration
      : maxListenDuration

    const stageLabel = fullPreviewRef.current
      ? 'FULL PREVIEW'
      : `${maxListenDuration}s LISTEN`

    return (
      <div
        className={[
          'audio-player',
          isPlaying ? 'audio-player--playing' : '',
          fullPreviewRef.current ? 'audio-player--full' : '',
          disabled ? 'audio-player--disabled' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <audio
          ref={audioRef}
          src={hasAudioUrl ? audioUrl : undefined}
          preload="auto"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleAudioTimeUpdate}
          onEnded={handleAudioEnded}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={handleCanPlay}
          onError={handleAudioError}
        />

        <div className="audio-player__top">
          <span className="audio-player__label">
            {isPlaying ? 'NOW PLAYING' : 'READY TO PLAY'}
          </span>

          <span className="audio-player__stage">{stageLabel}</span>
        </div>

        <div className="audio-player__main">
          <button
            type="button"
            className="audio-player__play"
            onClick={handlePlayPause}
            disabled={disabled || hasError || !hasAudioUrl}
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
                    active ? 'audio-player__bar--active' : '',
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
              fullPreviewRef.current
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

        {!hasAudioUrl && !hasError && (
          <div className="audio-player__error">
            NO AUDIO PREVIEW AVAILABLE
          </div>
        )}
      </div>
    )
  },
)

AudioPlayer.displayName = 'AudioPlayer'

export default AudioPlayer
