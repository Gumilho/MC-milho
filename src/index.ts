require('dotenv').config()
import { Client, Collection, StageChannel } from 'discord.js';

import { PrismaClient } from '@prisma/client'
import { MusicPlayer } from './MusicPlayer';
import { commands } from './utils';
export const prisma = new PrismaClient()


export const musicPlayers = new Collection<string, MusicPlayer>()
const token = process.env.MCMILHO_TOKEN

const client = new Client({ intents: ['GUILD_VOICE_STATES', 'GUILD_MESSAGES', 'GUILDS'] });
// client.on('interactionCreate', interaction => {
// 	if (!interaction.isSelectMenu())
// 	console.log(interaction.guildId)
// })

client.on('error', console.warn);

client.on('interactionCreate', async interaction => {
	if (!interaction.guildId) return
	if (interaction.isCommand()) {
		const command = commands.get(interaction.commandName)
		console.log(`found command ${interaction.commandName}`)
		if (!command) return
		try {
			await command(interaction)
		} catch (error) {
			console.error(error)
			await interaction.reply({ content: 'The command failed', ephemeral: true })
		}
	}

})

client.on('ready', async client => {
	console.log(`Logged in as ${client.user.tag}`)
	const entries = await prisma.guild.findMany()
	entries.forEach(async entry => {

		const stage_channel = client.guilds.cache.get(entry.id)?.channels.cache.get(entry.stage_id!)
		if (!stage_channel) {
			console.log('No channel')
			return
		}
		if (!(stage_channel instanceof StageChannel)) {
			console.log(`Channel ${entry.stage_id} in guild ${entry.name} is not a Stage Channel`)
			return
		}

		const newPlayer = new MusicPlayer(stage_channel, entry.playlist)
		musicPlayers.set(entry.id, newPlayer)
		
		if (!entry.stage_id) return

	})
});
void client.login(token);
