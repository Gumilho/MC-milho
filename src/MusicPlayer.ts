import type { StageChannel } from "discord.js";
import type { Playlist as PlaylistModel, PrismaClient } from "@prisma/client";
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
		public prisma: PrismaClient,
		public playlists: PlaylistModel[],
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

	async play() {
		const playlist = await ytpl(this.playlists[0].id)
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

	public static async setup(channel: StageChannel, prisma: PrismaClient, playlists: PlaylistModel[]) {
		//guild, stage_channel, prisma, entry.playlists)
		const newPlayer = new MusicPlayer(channel, prisma, playlists)
		return newPlayer
	}
}