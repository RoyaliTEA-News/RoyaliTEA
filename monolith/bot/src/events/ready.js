import { event } from 'jellycommands';
import { ActivityType } from 'discord.js'
import debug from 'debug'
const log = debug('bot')

export default event({
	name: 'ready',
	run: (_, client) => {
		log(client.user.tag, 'is online.')
		client.user.setPresence({
			activities: [{
				name: 'royalitea.news',
				type: ActivityType.Listening,
			}],
		});
	},
});
