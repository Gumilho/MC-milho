import { Collection, CommandInteraction } from 'discord.js'

import { musicPlayers, prisma } from './index'
import { MusicPlayer } from './MusicPlayer';

type SlashCommand = (interaction: CommandInteraction) => Promise<any>;
export const commands = new Collection<string, SlashCommand>([
	[
		'play',
		async (interaction) => {
			if (!interaction.guild) return

			const musicPlayer = musicPlayers.get(interaction.guild.id)

			if (!musicPlayer) {
				interaction.reply({ content: 'Guild not registered', ephemeral: true })
				return
			}
			await interaction.deferReply({ ephemeral: true })
			console.info('Running play')
			const url = interaction.options.getString('playlist', true)
			await musicPlayer.setPlaylist(url)
			await interaction.editReply({ content: `playing playlist` })
		},
	], [
		'setup',
		async (interaction) => {

			if (!interaction.guild) return

			const channelName = interaction.options.getString('channel') || 'mc-milho'
			const musicPlayer = await MusicPlayer.create(interaction.guild, channelName)
			interaction.reply({ content: 'Channel created successfully!', ephemeral: true })
			musicPlayers.set(interaction.guild.id, musicPlayer)
		},
	],
])