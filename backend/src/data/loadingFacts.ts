export type LoadingFactCategory =
  | 'song'
  | 'artist'
  | 'album'
  | 'genre'
  | 'era'
  | 'tip'
  | 'general'

export type LoadingFact = {
  text: string
  category: LoadingFactCategory
  relatedArtist?: string
  relatedSong?: string
  relatedAlbum?: string
  relatedGenre?: string
  relatedEra?: string
}

export const loadingFacts: LoadingFact[] = [
  // =========================================================
  // GENERAL MUSIC FACTS
  // =========================================================

  {
    text: 'A song can become recognizable from only a few seconds of its intro.',
    category: 'general',
  },

  {
    text: 'Some songs use silence as part of the musical arrangement, making the moments around the silence just as important as the sound.',
    category: 'general',
  },

  {
    text: 'The human brain can recognize familiar songs extremely quickly, sometimes before you consciously identify the artist or title.',
    category: 'general',
  },

  {
    text: 'A memorable chorus is often designed to be easier to remember and sing along with than the surrounding sections of a song.',
    category: 'general',
  },

  {
    text: 'Many songs contain recurring musical patterns that help listeners recognize them after only a few notes.',
    category: 'general',
  },

  {
    text: 'Music trivia gets much harder when you only hear the instrumental introduction.',
    category: 'tip',
  },

  {
    text: 'Listen for the voice, instruments, rhythm, and production style. They can all give you clues.',
    category: 'tip',
  },

  {
    text: 'Sometimes the easiest way to identify a song is to recognize the artist before thinking about the title.',
    category: 'tip',
  },

  {
    text: 'Pay attention to distinctive drum patterns, guitar riffs, synth sounds, and vocal styles when guessing a song.',
    category: 'tip',
  },

  {
    text: 'Think you know the song? Try identifying the decade before locking in your answer.',
    category: 'tip',
  },

  // =========================================================
  // ARTIST FACTS
  // =========================================================

  {
    text: 'Michael Jackson began performing professionally as a child as a member of The Jackson 5.',
    category: 'artist',
    relatedArtist: 'Michael Jackson',
  },

  {
    text: 'Beyoncé first became widely known as a member of Destiny’s Child before building her solo career.',
    category: 'artist',
    relatedArtist: 'Beyoncé',
  },

  {
    text: 'Rihanna was born in Barbados and became one of the most commercially successful artists of her generation.',
    category: 'artist',
    relatedArtist: 'Rihanna',
  },

  {
    text: 'Whitney Houston was known for her powerful vocal performances and became one of the defining voices of her era.',
    category: 'artist',
    relatedArtist: 'Whitney Houston',
  },

  {
    text: 'Prince was known not only as a singer but also as a songwriter, producer, and multi-instrumentalist.',
    category: 'artist',
    relatedArtist: 'Prince',
  },

  {
    text: 'Stevie Wonder is a multi-instrumentalist who has played keyboards, harmonica, drums, and other instruments throughout his career.',
    category: 'artist',
    relatedArtist: 'Stevie Wonder',
  },

  {
    text: 'Bob Marley helped bring reggae music to audiences around the world.',
    category: 'artist',
    relatedArtist: 'Bob Marley',
  },

  {
    text: 'Aretha Franklin became known as one of the most influential voices in soul and R&B.',
    category: 'artist',
    relatedArtist: 'Aretha Franklin',
  },

  {
    text: 'Madonna has repeatedly reinvented her musical style and visual identity throughout her career.',
    category: 'artist',
    relatedArtist: 'Madonna',
  },

  {
    text: 'David Bowie was known for continually experimenting with different musical styles and artistic personas.',
    category: 'artist',
    relatedArtist: 'David Bowie',
  },

  {
    text: 'Elton John is known for his piano-driven performances and songwriting collaborations with Bernie Taupin.',
    category: 'artist',
    relatedArtist: 'Elton John',
  },

  {
    text: 'Dolly Parton is both a performer and prolific songwriter whose songs have been recorded by many different artists.',
    category: 'artist',
    relatedArtist: 'Dolly Parton',
  },

  {
    text: 'Johnny Cash became one of the most recognizable voices in country music.',
    category: 'artist',
    relatedArtist: 'Johnny Cash',
  },

  {
    text: 'Shakira is known for combining Latin pop with elements from rock, dance, and other musical styles.',
    category: 'artist',
    relatedArtist: 'Shakira',
  },

  {
    text: 'Daddy Yankee played a major role in bringing reggaeton to a worldwide audience.',
    category: 'artist',
    relatedArtist: 'Daddy Yankee',
  },

  {
    text: 'Wizkid became one of the most internationally recognized artists associated with modern Afrobeats.',
    category: 'artist',
    relatedArtist: 'Wizkid',
  },

  {
    text: 'Burna Boy has helped bring contemporary Nigerian music to a global audience.',
    category: 'artist',
    relatedArtist: 'Burna Boy',
  },

  {
    text: 'Rema became one of the prominent younger voices in the global Afrobeats scene.',
    category: 'artist',
    relatedArtist: 'Rema',
  },

  {
    text: 'BLACKPINK became one of the most internationally recognized K-pop groups.',
    category: 'artist',
    relatedArtist: 'BLACKPINK',
  },

  {
    text: 'BTS helped expand the international audience for K-pop through music, performances, and global collaborations.',
    category: 'artist',
    relatedArtist: 'BTS',
  },

  // =========================================================
  // SONG FACTS
  // =========================================================

  {
    text: 'Blinding Lights became one of the defining pop hits of the early 2020s.',
    category: 'song',
    relatedArtist: 'The Weeknd',
    relatedSong: 'Blinding Lights',
  },

  {
    text: 'Billie Jean is one of Michael Jackson’s best-known songs and features one of pop music’s most recognizable bass lines.',
    category: 'song',
    relatedArtist: 'Michael Jackson',
    relatedSong: 'Billie Jean',
  },

  {
    text: 'Bohemian Rhapsody combines multiple musical sections rather than following a conventional verse-chorus structure throughout.',
    category: 'song',
    relatedArtist: 'Queen',
    relatedSong: 'Bohemian Rhapsody',
  },

  {
    text: 'Smells Like Teen Spirit became closely associated with the grunge movement of the early 1990s.',
    category: 'song',
    relatedArtist: 'Nirvana',
    relatedSong: 'Smells Like Teen Spirit',
  },

  {
    text: 'Like a Prayer combined pop songwriting with gospel influences and became one of Madonna’s signature songs.',
    category: 'song',
    relatedArtist: 'Madonna',
    relatedSong: 'Like a Prayer',
  },

  {
    text: 'No Woman, No Cry became one of Bob Marley’s best-known songs internationally.',
    category: 'song',
    relatedArtist: 'Bob Marley & The Wailers',
    relatedSong: 'No Woman, No Cry',
  },

  {
    text: 'Gasolina became one of the songs strongly associated with reggaeton’s rise to international popularity.',
    category: 'song',
    relatedArtist: 'Daddy Yankee',
    relatedSong: 'Gasolina',
  },

  {
    text: 'Shape of You became one of Ed Sheeran’s biggest global hits.',
    category: 'song',
    relatedArtist: 'Ed Sheeran',
    relatedSong: 'Shape of You',
  },

  {
    text: 'Rolling in the Deep helped establish Adele as one of the major pop and soul voices of the 2010s.',
    category: 'song',
    relatedArtist: 'Adele',
    relatedSong: 'Rolling in the Deep',
  },

  {
    text: 'Uptown Funk became one of the most recognizable funk-pop hits of the 2010s.',
    category: 'song',
    relatedArtist: 'Mark Ronson',
    relatedSong: 'Uptown Funk',
  },

  // =========================================================
  // GENRE FACTS
  // =========================================================

  {
    text: 'Hip-hop developed from a broader cultural movement that included DJing, MCing, breakdancing, and graffiti.',
    category: 'genre',
    relatedGenre: 'hip-hop',
  },

  {
    text: 'Reggae developed in Jamaica during the late 1960s and became an influential genre worldwide.',
    category: 'genre',
    relatedGenre: 'reggae',
  },

  {
    text: 'R&B has evolved considerably over the decades, incorporating elements of soul, funk, pop, hip-hop, and electronic music.',
    category: 'genre',
    relatedGenre: 'r&b',
  },

  {
    text: 'Rock music developed from earlier styles including blues, rhythm and blues, and country music.',
    category: 'genre',
    relatedGenre: 'rock',
  },

  {
    text: 'Country music has roots in several American folk and traditional musical styles.',
    category: 'genre',
    relatedGenre: 'country',
  },

  {
    text: 'K-pop often combines Korean pop songwriting with influences from hip-hop, R&B, electronic music, and dance music.',
    category: 'genre',
    relatedGenre: 'k-pop',
  },

  {
    text: 'Afrobeats is a broad modern African pop movement that incorporates influences from many different musical traditions.',
    category: 'genre',
    relatedGenre: 'afrobeats',
  },

  {
    text: 'Reggaeton developed from Caribbean and Latin American musical influences, particularly reggae en español and dancehall.',
    category: 'genre',
    relatedGenre: 'latin',
  },

  // =========================================================
  // ERA FACTS
  // =========================================================

  {
    text: 'The 1960s saw major changes in rock, soul, pop, folk, and psychedelic music.',
    category: 'era',
    relatedEra: '1960s',
  },

  {
    text: 'The 1970s produced major movements in disco, funk, rock, reggae, soul, and early hip-hop.',
    category: 'era',
    relatedEra: '1970s',
  },

  {
    text: 'The 1980s were strongly associated with synthesizers, drum machines, MTV, pop, rock, and new wave.',
    category: 'era',
    relatedEra: '1980s',
  },

  {
    text: 'The 1990s saw major shifts in hip-hop, R&B, grunge, pop, electronic music, and alternative rock.',
    category: 'era',
    relatedEra: '1990s',
  },

  {
    text: 'The 2000s saw digital music become increasingly important to how people discovered and listened to songs.',
    category: 'era',
    relatedEra: '2000s',
  },

  {
    text: 'The 2010s saw streaming become a major part of music consumption and discovery.',
    category: 'era',
    relatedEra: '2010s',
  },

  {
    text: 'The 2020s have seen streaming, short-form video, and global collaborations continue to influence how songs spread.',
    category: 'era',
    relatedEra: '2020s',
  },
]