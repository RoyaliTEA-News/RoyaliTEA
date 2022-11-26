import 'dotenv/config'
import { JellyCommands } from 'jellycommands'
import { Partials, GatewayIntentBits } from 'discord.js'

const client = new JellyCommands({
	commands: 'src/commands',
	events: 'src/events',
	clientOptions: {
		intents: Object.values(GatewayIntentBits).filter(k => !isNaN(k)),
		partials: Object.values(Partials).filter(k => !isNaN(k)),
		ws: {
			properties: {
				browser: 'Discord Android',
			},
		},
	},
	cache: true,
	dev: {
		global: true,
		guilds: ['906890954009636934'],
	},
})

client.login()
