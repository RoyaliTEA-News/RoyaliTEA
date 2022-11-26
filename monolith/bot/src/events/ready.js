import { event } from 'jellycommands'
import { ActivityType } from 'discord.js'
import debug from 'debug'
const log = debug('royalitea:bot')

export default event({
	name: 'ready',
	run: (_, client) => {
		log(client.user.tag, 'is online.')
		const setPresence = () => {
			client.user.setPresence({
				activities: [{
					name: 'royalitea.news',
					type: ActivityType.Listening,
				}],
			})
		}
		setPresence()
		setInterval(setPresence, 5 * 60 * 1000)
	},
})
