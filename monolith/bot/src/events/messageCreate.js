import { event } from 'jellycommands';
import { EmbedBuilder } from 'discord.js'
import debug from 'debug'
const log = debug('bot')

export default event({
	name: 'messageCreate',
	run: (client, message) => {
    if (!message) return log('warning: message is undefined')
    if (message.author.bot) return
    // TODO
    if (message.author.id === '969650307464298636' && message.content.startsWith('relay ')) {
      message.channel.send({ content: message.content.slice(5) })
    }
	},
})