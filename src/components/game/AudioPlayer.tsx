import {
  Pause,
  Play,
} from 'lucide-react'

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

const AudioPlayer = forwardRef<
  AudioPlayerHandle,
  AudioPlayerProps
>(
  function AudioPlayer(
    {
      audioUrl,
      maxListenDuration = 0.1,
      onTimeUpdate,
      onStageComplete,
      onPreviewComplete,
      disabled = false,
      playFullSong = false,
    },
    ref,
  ) {
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
     * Play the complete available preview.
     *
     * This function is intentionally exposed to
     * Game.tsx so it can be called directly from
     * the user's "Reveal Answer" click.
     */
    async function playPreview() {
      const audio =
        audioRef.current

      if (
        !audio ||
        hasError
      ) {
        return
      }

      try {
        /*
         * Do NOT reset currentTime.
         *
         * If the player had listened to 2 seconds,
         * the preview continues from 2 seconds.
         */
        await audio.play()

        setIsPlaying(true)
      } catch (error) {
        console.error(
          'Unable to play preview:',
          error,
        )

        setHasError(true)
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
     * Reset everything when the song changes.
     */
    useEffect(() => {
      const audio =
        audioRef.current

      setIsPlaying(false)
      setTimeLeft(
        maxListenDuration,
      )
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
     * Reset playback whenever a new listening
     * stage is unlocked.
     *
     * Example:
     *
     * 0.1s → replay from 0 for 0.5s
     * 0.5s → replay from 0 for 2s
     * 2s   → replay from 0 for 8s
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
      setTimeLeft(
        maxListenDuration,
      )
      setProgress(0)

      onTimeUpdate?.(
        maxListenDuration,
      )
    }, [
      maxListenDuration,
      disabled,
      hasError,
      playFullSong,
      onTimeUpdate,
    ])

    /*
     * When full-preview mode becomes active,
     * we DO NOT call play() here.
     *
     * Game.tsx already calls playPreview()
     * directly from the Reveal button click.
     *
     * This state is only responsible for
     * changing the player into full-preview mode.
     */

    function handleLoadedMetadata() {
      const audio =
        audioRef.current

      if (!audio) {
        return
      }

      if (
        Number.isFinite(
          audio.duration,
        ) &&
        audio.duration > 0
      ) {
        setPreviewDuration(
          audio.duration,
        )
      }
    }

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
          Number.isFinite(
            duration,
          ) &&
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
       * Keep currentTime where it is.
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

    function handleAudioEnded() {
      setIsPlaying(false)

      /*
       * The actual Deezer preview has finished.
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
      if (
        stageCompleteRef.current
      ) {
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
         * Replay the current listening stage.
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
  },
)

export default AudioPlayer