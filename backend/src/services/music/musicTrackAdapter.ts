import type { MusicTrack } from './musicProvider.js'

export type GameSong = {
  id: string
  title: string
  artist: string
  album: string
  releaseYear: number
  artworkUrl: string
  audioUrl?: string
  genres: string[]
  provider: string
  providerId: string
}

export function musicTrackToGameSong(
  track: MusicTrack,
): GameSong {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    album: track.album,
    releaseYear:
      track.releaseYear ?? 0,
    artworkUrl:
      track.artworkUrl ?? '',
    audioUrl:
      track.previewUrl,
    genres:
      track.genres,
    provider:
      track.provider,
    providerId:
      track.providerId,
  }
}