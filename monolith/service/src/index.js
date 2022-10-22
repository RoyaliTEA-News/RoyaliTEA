import { RadiosApi, ElevateTools } from './config.js'
import axios from 'axios'
import LRU from 'lru-cache'

const Radios = axios.create({
  baseURL: RadiosApi.BaseUri,
})

const Elevate = axios.create({
  baseURL: ElevateTools.BaseUri,
})

const RadiosCache = {
  lastUpdated: null,
  store: new Map(),
  ttl: 60 * 1000,
}

export const updateRadios = async () => {
  try {
    const radios = await Radios.get('/stations')
    for (const { metadata } of Object.values(radios.data)) {
      RadiosCache.store.set(metadata.id, metadata)
    }
    RadiosCache.lastUpdated = Date.now()
  } catch {}
  return RadiosCache
}

export const _updateRadiosIfNeeded = async () => {
  if (!RadiosCache.lastUpdated || Date.now() - RadiosCache.lastUpdated > RadiosCache.ttl) {
    await updateRadios()
    return true
  }
  return false
}

export const getRadios = async () => {
  await _updateRadiosIfNeeded()
  return RadiosCache.store
}

export const getRadio = async (id) => {
  await _updateRadiosIfNeeded()
  return RadiosCache.store.get(id)
}

const DefaultSongData = {
  isrc: null,
  title: null,
  artist: null,
  album: {
    id: null,
    title: null,
    covers: {
      small: null,
      medium: null,
      large: null,
    },
    primaryColor: null,
  },
  released: null,
  spotifyId: null,
  preview: null,
  popularity: null,
  duration: null,
  lyrics: null,
  explicit: false,
}

export const _fetchSong = async (radioApiSong) => {
  const song = DefaultSongData
  if (!radioApiSong.title || !radioApiSong.artist) {
    return song
  }
  let elevateSong
  try {
    const songRequest = await Elevate.get(`/lookup/song?title=${encodeURIComponent(radioApiSong.title)}&artist=${encodeURIComponent(radioApiSong.artist)}`)
    if (songRequest?.data && songRequest.data.found && !songRequest.data.error && songRequest.data.result) {
      elevateSong = songRequest.data.result
    }
  } catch {}
  try {
    const lyricsRequest = await Elevate.get(`/lookup/lyrics?title=${encodeURIComponent(radioApiSong.title)}&artist=${encodeURIComponent(radioApiSong.artist)}`)
    if (lyricsRequest?.data && lyricsRequest.data.found && !lyricsRequest.data.error && lyricsRequest.data.result) {
      song.lyrics = []
      for (const line of lyricsRequest.data.result.lines.slice(0, -1)) {
        if (!line || isNaN(line.startTimeMs)) {
          continue
        }
        song.lyrics.push({
          at: line.startTimeMs,
          text: line.words || '',
        })
      }
    }
  } catch {}
  if (!elevateSong) {
    return song
  }
  song.isrc = elevateSong.isrc
  song.title = elevateSong.title
  song.artist = elevateSong.artist
  song.album.id = elevateSong.album?.id
  song.album.title = elevateSong.album?.name
  song.album.covers.small = elevateSong.covers?.small
  song.album.covers.medium = elevateSong.covers?.medium
  song.album.covers.large = elevateSong.covers?.big
  song.album.primaryColor = elevateSong.color
  if (elevateSong.release?.dateFormatted?.unix) {
    try {
      song.released = elevateSong.release.dateFormatted.unix * 1000
    } catch {}
  }
  song.spotifyId = elevateSong.spotify_id
  song.preview = elevateSong.preview
  if (elevateSong.popularity && !isNaN(elevateSong.popularity)) {
    song.popularity = elevateSong.popularity
  }
  if (elevateSong.duration?.ms && !isNaN(elevateSong.duration?.ms)) {
    song.duration = elevateSong.duration.ms
  }
  song.explicit = Boolean(elevateSong.explicit)
  return song
}

const ElevateCache = new LRU({
  max: 1000,
  ttl: 3 * 60 * 60 * 1000,
  fetchMethod: (radioApiSong) => _getSong(radioApiSong),
})

export const getSong = async (radioApiSong) => {
  const song = ElevateCache.get(radioApiSong)
  if (song) {
    return song
  }
  const newSong = await _fetchSong(radioApiSong)
  ElevateCache.set(radioApiSong, newSong)
  return newSong
}

export const _fetchRadioNowPlaying = async (id) => {
  const { data } = await Radios.get(`/stations/${id}/playing/now`)
  return data
}

export const NowPlaying = new LRU({
  max: 100,
  ttl: 3 * 1000,
  fetchMethod: (id) => _fetchRadioNowPlaying(id),
})

export const getRadioNowPlaying = async (id) => {
  const data = await NowPlaying.get(id)
  if (data) {
    return data
  }
  const radioApiNowPlayingResponse = await _fetchRadioNowPlaying(id)
  const song = await getSong({
    title: radioApiNowPlayingResponse?.title,
    artist: radioApiNowPlayingResponse?.artist,
  })
  const np = {
    song,
    dj: radioApiNowPlayingResponse?.dj || null,
    listeners: radioApiNowPlayingResponse?.listeners,
  }
  if (isNaN(np.listeners)) {
    np.listeners = 0
  }
  NowPlaying.set(id, np)
  return np
}

export {
  Radios as _Radios,
  Elevate as _Elevate,
  RadiosCache as _RadiosCache,
}