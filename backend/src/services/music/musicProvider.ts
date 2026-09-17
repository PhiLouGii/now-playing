export type MusicTrack = {
  id: string
  title: string
  artist: string
  album: string
  releaseYear?: number
  isrc?: string
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

  getArtistTracks(
    artistName: string,
    limit?: number,
  ): Promise<MusicTrack[]>
}