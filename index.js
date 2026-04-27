require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  entersState,
  VoiceConnectionStatus,
} = require("@discordjs/voice");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

let connection;

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  const channel = await guild.channels.fetch(process.env.VOICE_CHANNEL_ID);

  if (!channel) return console.log("VC not found");

  connect(channel);
});

function connect(channel) {
  connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf: true,
  });

  console.log("Joined VC");

  reconnect();
  playSilence();
}

function reconnect() {
  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5000),
      ]);
    } catch {
      connection.destroy();
      console.log("Rejoining...");
      setTimeout(() => connect(channel), 5000);
    }
  });
}

function playSilence() {
  const player = createAudioPlayer();

  const resource = createAudioResource(
    "https://www.soundhelix.com/examples/mp3/Silence.mp3"
  );

  player.play(resource);
  connection.subscribe(player);

  player.on(AudioPlayerStatus.Idle, () => playSilence());
}

client.login(process.env.TOKEN);