import { command } from 'jellycommands'
import { getRadio, getRadios, getRadioNowPlaying } from '../../../service/src/index.js'
import { Colors } from '../config.js'
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'

export default command({
  name: 'nowplaying',
  description: 'View the live stats from a selected radio station.',
  global: true,
  options: [
    {
      type: 'String',
      name: 'station',
      description: 'The radio station to query',
      required: true,
      autocomplete: true,
    },
  ],

  run: async ({ interaction }) => {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('Loading...')
          .setColor(Colors.Primary)
      ],
    })
    const stationId = interaction.options.getString('station', true)
    const station = await getRadio(stationId)
    if (!station) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`Station \`${stationId}\` not found.`)
            .setColor(Colors.Error)
        ],
      })
    }
    const nowPlaying = await getRadioNowPlaying(stationId)
    if (!nowPlaying || !nowPlaying.song) {
      return interaction.reply({
        content: `I couldn't find any information about \`${stationId}\`.`,
        ephemeral: true,
      })
    }
    const { song } = nowPlaying
    // Create an embed with buttons for "Listen on Spotify", "Lyrics", and "View Album on Spotify"
    const embed = new EmbedBuilder()
      .setColor(song.album?.primaryColor || Colors.Primary)
      .setAuthor({
        name: `Now Playing on ${station.name}`,
        iconURL: station.logo,
        url: station.website,
      })
      .setTitle(song.title || 'Unknown Song')
      .setDescription(song.artist || 'Unknown Artist')
    if (song.album?.name) {
      embed.addFields([
        {
          name: 'Album',
          value: `[${song.album.title}](https://open.spotify.com/album/${song.album.id})`,
          inline: false,
        },
      ])
    }
    embed
      .addFields([
        {
          name: 'Listeners',
          value: '`🎧 ' + nowPlaying.listeners + '`',
          inline: true,
        },
        {
          name: 'DJ',
          value: '`🎙️ ' + (nowPlaying.dj || 'Auto DJ') + '`',
          inline: true,
        },
      ])
      .setThumbnail(song.album?.covers?.small)
    const row = new ActionRowBuilder()
    row.addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel(`Open ${station.name}`)
        .setURL(station.website)
    )
    if (song.spotifyId) {
      row.addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel('Listen on Spotify')
          .setURL(`https://open.spotify.com/track/${song.spotifyId}`),
      )
    }
    // if (song.lyrics) {
    //   row.addComponents(
    //     new ButtonBuilder()
    //       .setStyle(ButtonStyle.Secondary)
    //       .setLabel('Lyrics')
    //       .setCustomId(`nowplaying-lyrics-${interaction.id}`),
    //   )
    // }
    if (row.components.length > 0) {
      interaction.editReply({ embeds: [embed], components: [row] })
    } else {
      interaction.editReply({ embeds: [embed] })
    }
    // const collector = interaction.channel.createMessageComponentCollector({
    //   filter: (i) => i.user.id === interaction.user.id && i.customId === `nowplaying-lyrics-${interaction.id}`,
    //   time: 60_000,
    // })
    // collector.on('collect', async (i) => {
    //   if (i.deferred || i.replied) return
    //   try {
    //     await i.deferUpdate()
    //   } catch {}
    //   let lyricsText = song.lyrics.map((line) => line.text).join('\n')
    //   const embeds = []
    //   while (lyricsText.length > 0) {
    //     const embed = new EmbedBuilder()
    //       .setColor(song.album?.primaryColor || Colors.Primary)
    //       .setDescription(lyricsText.slice(0, 4096))
    //     embeds.push(embed)
    //     lyricsText = lyricsText.slice(4096)
    //   }
    //   for (const embed of embeds) {
    //     await i.followUp({ embeds: [embed] })
    //   }
    // })
  },

  autocomplete: async ({ interaction }) => {
    const focused = interaction.options.getFocused(true)
    if (focused.name === 'station') {
      const matches = Array.from((await getRadios()).values())
        .filter((radio) => {
          let match = false
          if (!focused.value) {
            match = true
          }
          if (radio.name.toLowerCase().includes(focused.value.toLowerCase())) {
            match = true
          }
          if (radio.id.toLowerCase().includes(focused.value.toLowerCase())) {
            match = true
          }
          if (radio.aliases && radio.aliases.some((alias) => alias.toLowerCase().includes(focused.value.toLowerCase()))) {
            match = true
          }
          return match
        })
        /*
        .sort((a, b) => {
          if (a.name.toLowerCase() === focused.value.toLowerCase()) {
            return -1
          }
          if (b.name.toLowerCase() === focused.value.toLowerCase()) {
            return 1
          }
          if (a.name.toLowerCase().startsWith(focused.value.toLowerCase())) {
            return -1
          }
          if (b.name.toLowerCase().startsWith(focused.value.toLowerCase())) {
            return 1
          }
          if (a.id.toLowerCase().includes(focused.value.toLowerCase())) {
            return -1
          }
          if (b.id.toLowerCase().includes(focused.value.toLowerCase())) {
            return 1
          }
          if (a.name.toLowerCase().includes(focused.value.toLowerCase())) {
            return -1
          }
          if (b.name.toLowerCase().includes(focused.value.toLowerCase())) {
            return 1
          }
          if (a.aliases && a.aliases.some((alias) => alias.toLowerCase().includes(focused.value.toLowerCase()))) {
            return -1
          }
          if (b.aliases && b.aliases.some((alias) => alias.toLowerCase().includes(focused.value.toLowerCase()))) {
            return 1
          }
          return 0
        })
        */
        .map((radio) => ({ name: radio.name, value: radio.id }))
      interaction.respond(matches.slice(0, 10))
    }
  },
})