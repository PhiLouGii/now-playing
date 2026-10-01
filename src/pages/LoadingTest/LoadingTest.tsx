import LoadingScreen from '../../components/loading/LoadingScreen'

const testFacts = [
  {
    id: 'test-1',
    text: 'Blinding Lights became one of the defining pop hits of the early 2020s.',
    category: 'song',
    relatedArtist: 'The Weeknd',
    relatedSong: 'Blinding Lights',
  },
  {
    id: 'test-2',
    text: 'Bob Marley helped bring reggae music to audiences around the world.',
    category: 'artist',
    relatedArtist: 'Bob Marley',
  },
  {
    id: 'test-3',
    text: 'The 1990s saw major shifts in hip-hop, R&B, grunge, pop, and alternative rock.',
    category: 'era',
    relatedEra: '1990s',
  },
  {
    id: 'test-4',
    text: 'Listen for distinctive drum patterns, guitar riffs, synth sounds, and vocal styles when guessing a song.',
    category: 'tip',
  },
]

export default function LoadingTest() {
  return (
    <LoadingScreen
      facts={testFacts}
      message="Loading your game..."
    />
  )
}