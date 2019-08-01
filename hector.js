const Discord = require('discord.js');
const fs = require('fs');

class Client extends Discord.Client {
    /**
     * Creates a new Hector bot and load its configuration
     *
     * @constructor
     * @param {String} configPath - The path to configuration file
     * @param {String} commandsPath - An optional path to load general purpose commands from (those can be loaded later by manually calling `registerCommands`)
     */
    constructor(configPath, commandsPath = null) {
        // Call parent's (discord.js') constructor
        super();

        // Initialize attributes
        this.commands = new Discord.Collection();

        // Load the configuration
        this.config = require(configPath);

        // Load the general purpose commands if a path for it was given
        if (commandsPath) {
            this.registerCommands(commandsPath);
        }

        this.setHooks();
    }

    /** Set "ready" and "message" hooks */
    setHooks() {
        // When the bot is ready, log it.
        this.once('ready', () => {
            console.log('Ready!');
        });

        this.on('message', message => {
            // Ignore the message if not in the correct channel
            if (message.channel.name !== this.config.channel) {
                return;
            }

            // Log every message that goes to our channel
            console.log(`<${message.author.username}> ${message.content}`);

            // Do not handle the message if it's from a bot (like ourselves)
            if (message.author.bot) {
                return;
            }

            // Determine if the message is a command and handle it.
            if (message.content.startsWith(`${this.config.prefix}`)) {
                this.handleCommand(message);
            }
        });
    }

    /**
     * Find the general purpose bot commands and register their handler in the client (indexed by the command's name, without the command prefix).
     *
     * @param {String} folder - the path in which we'll search for commands to load. If it's relative to the working directory, it must start with './'
     */
    registerCommands(path) {
        const commandFiles = fs.readdirSync(`${path}`).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`${path}/${file}`);
            this.commands.set(command.name, command);
        }
    }

    /** Clean up a raw command and dispatch it to the correct handler
     *
     * @param {String} message
    */
    handleCommand(message) {
        // Isolate the command name (lowercased) and it's argument (in an array)
        const args = message.content.slice(this.config.prefix.length).split(/ +/);
        const commandName = args.shift().toLowerCase();

        // Dispatch to the correct handler, if any
        if (!this.commands.has(commandName)) {
            return message.reply(`je ne connais pas la commande "${config.prefix}${commandName}".`);
        }
        this.commands.get(commandName).execute(message, args, this);
    }

    /** Log in to discord */
    run() {
        this.login(this.config.token);
    }
}

module.exports.Client = Client;