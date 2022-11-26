import 'dotenv/config'
import { getRadios, getRadioNowPlaying } from '../../service/src/index.js'
import cron from 'node-cron'
import { InfluxDB, Point } from '@influxdata/influxdb-client'
import debug from 'debug'
const logListeners = debug('royalitea:stats:listeners')
const logSongChange = debug('royalitea:stats:songchange')

const writeNowPlaying = async () => {
  logListeners(`running at ${new Date().toLocaleString()}`)
  const writeApi = new InfluxDB({ url: process.env.INFLUX_URI, token: process.env.INFLUX_API_KEY }).getWriteApi(process.env.INFLUX_ORG, process.env.INFLUX_BUCKET, 'ns')
  try {
    const radios = [...(await getRadios()).values()]
    await Promise.all(radios.map(async radio => {
      try {
        const nowPlaying = await getRadioNowPlaying(radio.id)
        const point = new Point('radio')
          .tag('id', radio.id)
          .tag('name', radio.name)
          .intField('listeners', nowPlaying.listeners || 0)
        writeApi.writePoint(point)
        logListeners(`wrote ${radio.name}`)
      } catch (error) {
        logListeners(`error fetching ${radio.id}:`, error)
      }
    }))
    try {
      await writeApi.close()
    } catch (error) {
      logListeners('error writing to influx:', error)
    }
    logListeners(`done`)
  } catch (error) {
    logListeners(`error:`, error)
  }
}

writeNowPlaying()
cron.schedule('*/2 * * * *', writeNowPlaying)

let lastSongCache = {}
const pollNowPlaying = async () => {
  logSongChange(`running at ${new Date().toLocaleString()}`)
  const radios = [...(await getRadios()).values()]
  await Promise.all(radios.map(async radio => {
    try {
      const nowPlaying = await getRadioNowPlaying(radio.id)
      if (!nowPlaying?.song?.isrc) {
        logSongChange(`no song for ${radio.name}`)
        return
      }
      if (nowPlaying.song.isrc !== lastSongCache[radio.id]) {
        radio.nowPlaying = nowPlaying
        logSongChange(`song changed on ${radio.name}`)
      }
      lastSongCache[radio.id] = nowPlaying.song.isrc
    } catch (error) {
      logSongChange(`error fetching ${radio.id}:`, error)
    }
  }))
  logSongChange(`done`)
}
pollNowPlaying()
cron.schedule('*/5 * * * * *', pollNowPlaying)