import type { Guild, StageChannel } from "discord.js";
import { prisma } from "./index"
import { 
	AudioPlayer, 
	AudioPlayerStatus, 
	createAudioPlayer, 
	joinVoiceChannel, 
	VoiceConnection,
	createAudioResource,
	DiscordGatewayAdapterCreator,
} from "@discordjs/voice";
import ytdl from 'ytdl-core';
import ytpl from "ytpl";


export class MusicPlayer {
	public readonly audioPlayer: AudioPlayer = createAudioPlayer();
	public connection: VoiceConnection;
	public volume: number = 0.1;

	constructor(
		public channel: StageChannel,
		public current: string | null,
	) {

		this.connection = joinVoiceChannel({
			channelId: channel.id,
			guildId: channel.guild.id,
			adapterCreator: channel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator
		})
		this.connection.on('stateChange', async (_oldState, newState) => {
			if (newState.status === 'ready') {
				console.log('connected')
				channel.guild.me?.voice.setSuppressed(false)
				await this.play()
			}
		})
		this.connection.subscribe(this.audioPlayer)
		// this.audioPlayer.on('stateChange', (oldState, newState) => {
		// 	console.log(`state change from ${oldState.status} to ${newState.status}`)
		// 	this.update()
		// })
		this.audioPlayer.on(AudioPlayerStatus.Idle, async () => {
			await this.play()
		})
	}

	public static async create(guild: Guild, channelName: string) {
		
		const channel = await guild.channels.create(channelName, { type: 'GUILD_STAGE_VOICE' })
		
		await prisma.guild.create({
			data: {
				id: guild.id,
				name: guild.name,
				stage_id: channel.id
			}
		})
		return new MusicPlayer(channel, null)
	}
	public async play() {
		if (!this.current) return
		const playlist = await ytpl(this.current)
		const current = playlist.items.map(item => `https://www.youtube.com/watch?v=${item.id}`)

		const index = Math.floor(Math.random() * current.length)
		
		console.log(`playing ${current[index]}`)
		const resource = createAudioResource(
			ytdl(current[index], {
				highWaterMark: 1024*1024*64,
				quality: 'highestaudio',
			}),
			{ inlineVolume: true }
		)
		resource.volume?.setVolume(this.volume)
		this.audioPlayer.play(resource)
	}

	public async setPlaylist(input: string) {
		
		if (!/https?:\/\/(www|music)\.?youtube\.com|youtu\.be\/.*/.test(input)) throw new Error("not a youtube URL")
		const url = new URL(input)
		if (url.pathname !== '/playlist') throw new Error("not a playlist URL")
		const id = url.searchParams.get('list')
		if (!id) throw new Error("no id wtf")
		const guildId = this.channel.guildId
		await prisma.guild.update({
			where: { id: guildId },
			data: {
				playlist: id
			}
		})
		this.current = id
		await this.play()
	}
}