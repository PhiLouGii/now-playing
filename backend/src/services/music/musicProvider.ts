export type MusicTrack = {
  id: string
  title: string
  artist: string
  album: string
  releaseYear?: number
  artworkUrl?: string
  previewUrl?: string
  genres: string[]
  provider: string
  providerId: string
}

export interface MusicProvider {
  searchTracks(
    query: string,
    limit?: number,
  ): Promise<MusicTrack[]>

  getTrackById(
    id: string,
  ): Promise<MusicTrack | null>
}