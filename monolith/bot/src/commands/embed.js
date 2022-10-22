import { command } from 'jellycommands'
import { Colors } from '../config.js'
import { EmbedBuilder } from 'discord.js'

export default command({
  name: 'embed',
  description: 'Create a message embed.',
  options: [
    {
      name: 'description',
      description: 'The description of the embed.',
      type: 'String',
      required: true,
    },
    {
      name: 'title',
      description: 'The title of the embed.',
      type: 'String',
      required: false,
    },
  ],
  global: true,
  run: async ({ interaction, _client }) => {
    const title = interaction.options.getString('title')
    const description = interaction.options.getString('description')
    const embed = new EmbedBuilder()
    embed.setColor(Colors.Primary)
    if (title) embed.setTitle(title)
    embed.setDescription(description.replace(/\\n/g, '\n'))
    await interaction.deferReply()
    interaction.channel.send({ embeds: [embed] })
  }
})