const fs = require('fs');
const Discord = require('discord.js');

// Load configuration
const config = require('./config.json');

// Create the discord bot
const client = new Discord.Client();
client.config = config;

// Find all implemented bot commands and register their handler in the client (indexed by the command's name, without the command prefix).
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
client.commands = new Discord.Collection();
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

// Inform the admin launching the bot when it's ready
client.once('ready', () => {
	console.log('Ready!');
});

// Clean up a raw command and dispatch it to the correct handler
function handleCommand(message) {
    // Isolate the command name (lowercased) and it's argument (in an array)
    const args = message.content.slice(config.prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Dispatch to the correct handler, if any
    if (!client.commands.has(commandName)) {
        return message.reply(`je ne connais pas la commande "${config.prefix}${commandName}".`);
    }
    client.commands.get(commandName).execute(message, args, client);
}

client.on('message', message => {
    // Ignore the message if not in the correct channel
    if (message.channel.name !== config.channel) {
        return;
    }

    // Log every message that goes to our channel
    console.log(`<${message.author.username}> ${message.content}`);

    // Do not handle the message if it's from a bot (like ourselves)
    if (message.author.bot) {
        return;
    }

    // Determine if the message is a command and handle it.
    if (message.content.startsWith(`${config.prefix}`)) {
        handleCommand(message);
    }
});

// Once every callback is setup, connect the bot
client.login(client.config.token);