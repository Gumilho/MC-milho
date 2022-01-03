
require('dotenv').config({ path: '.env' })
import { Client, Collection, StageChannel } from 'discord.js';

import { PrismaClient } from '@prisma/client'
import { MusicPlayer } from './MusicPlayer';
const prisma = new PrismaClient()


const musicPlayers = new Collection<string, MusicPlayer>()
const token = process.env.MCMILHO_TOKEN

const client = new Client({ intents: ['GUILD_VOICE_STATES', 'GUILD_MESSAGES', 'GUILDS'] });
// client.on('interactionCreate', interaction => {
// 	if (!interaction.isSelectMenu())
// 	console.log(interaction.guildId)
// })

client.on('error', console.warn);
client.on('ready', async client => {
	console.log(`Logged in as ${client.user.tag}`)
	const entries = await prisma.guild.findMany({ include: { playlists: true } })
	entries.forEach(async entry => {

		const stage_channel = client.guilds.cache.get(entry.id)?.channels.cache.get(entry.stage_id!)
		if (!stage_channel) {
			console.log('No channel')
			return
		}
		if (!(stage_channel instanceof StageChannel)) {
			console.log(`Channel ${entry.channel_id} in guild ${entry.name} is not a Stage Channel`)
			return
		}
		if (entry.playlists.length === 0) {
			console.log(`No playlist on guild ${entry.name}`)
			return
		}

		const newPlayer = await MusicPlayer.setup(stage_channel, prisma, entry.playlists)
		musicPlayers.set(entry.id, newPlayer)
		
		if (!entry.stage_id) return

	})
});
void client.login(token);
