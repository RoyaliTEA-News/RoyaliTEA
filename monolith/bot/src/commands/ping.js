import { command } from 'jellycommands'

export default command({
  name: 'ping',
  description: 'Replies with the bot\'s ping.',
  global: true,
  run: async ({ interaction, client }) => {
    const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
    interaction.editReply(`Pong!\nWebsocket heartbeat: ${client.ws.ping}ms\nRoundtrip latency: ${sent.createdTimestamp - interaction.createdTimestamp}ms`);
  }
})