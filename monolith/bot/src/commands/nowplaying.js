import { command } from 'jellycommands'
import { getRadios } from '../../../service/src/index.js'

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

  run: ({ interaction }) => {

  },

  autocomplete: async ({ interaction }) => {
    const focused = interaction.options.getFocused(true);
    console.log(focused.value)
    if (focused.name === 'station') {
      interaction.respond(
        Array.from((await getRadios()).values())
          .filter((radio) => {
            let match = false
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
          .sort((a, b) => {
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
          .map((radio) => radio.name)
      )
    }
  },
})