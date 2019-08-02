const Discord = require("discord.js");
const fs = require("fs");

class Client extends Discord.Client {
    /**
     * Creates a new Hector bot and load its configuration
     *
     * @constructor
     * @param {String} configPath - The path to configuration file
     * @param {String} commandsPath - An optional path to load general purpose commands from (those can be loaded later by manually calling `registerCommands`)
     */
    constructor(configPath, commandsPath = null, gamesPath = null) {
        // Call parent's (discord.js') constructor
        super();

        // Initialize commands collections
        this.commands = new Discord.Collection();
        this.game_commands = new Discord.Collection();

        // TODO: players who are ready to play

        // Put a placeholder for the future loaded game
        this.available_games = new Discord.Collection();
        this.game = null;

        // Buffer for `bufferizeText`, `flushBufferToString` and `flushBufferToRichEmbed`
        this.textBuffer = "";

        // Load the configuration
        this.config = require(configPath);

        // Load the general purpose commands and available games
        this.registerCommands(this.config.commandsPath);
        this.registerGames(this.config.gamesPath);

        this.setHooks();
    }

    /** Set "ready" and "message" hooks */
    setHooks() {
        // When the bot is ready, log it.
        this.once("ready", () => {
            console.log("Ready!");
        });

        this.on("message", message => {
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
     * @param {String} path - the path in which we'll search for commands to load. If it's relative to the working directory, it must start with "./"
     * @param {Boolean} [game = false] - weather these commands are specific to the current loaded game or not
     */
    registerCommands(path, game=false) {
        const commandFiles = fs.readdirSync(`${path}`).filter(file => file.endsWith(".js"));
        for (const file of commandFiles) {
            const command = require(`${path}/${file}`);

            if (game) {
                this.game_commands.set(command.name, command);
            } else {
                this.commands.set(command.name, command);
            }
        }
    }

    /**
     * Set up a game
     *
     * @param {String} gameName - the name of the game
     * @param {Discord.Messag} message - the message that prompted the loading of that game, if available
     */
    loadGame(gameName, message = null) {
        this.game = this.available_games.get(gameName);
        console.log(`loading the game "${this.game.name}`)
        this.registerCommands(`${this.game.path}/commands`, true);
        this.game.load(this, message);
    }

    /**
     * Get rid of the game setup
     *
     * @param {Discord.Messag} message - the message that prompted the loading of that game, if available
     */
    unloadGame(message = null) {
        if (!this.game) { // No game is loaded
            return console.log("Warning: no game was loaded but unloadGame was called")
        }

        console.log(`unloading the game "${this.game.name}`)
        this.game.unload(message);
        this.game = null;
        this.game_commands = new Discord.Collection();
    }

    /**
     * Find the available games and register their handler in the client (indexed by the game's name).
     *
     * @param {String} path - the path in which we'll search for games to register. If it's relative to the working directory, it must start with "./"
     */
    registerGames(path) {
        const gameDirs = fs.readdirSync(`${path}`, {withFileTypes: true}).filter(dirent => dirent.isDirectory());
        for (const dir of gameDirs) {
            const game = require(`${path}/${dir.name}/game.js`);

            this.available_games.set(game.short_name, game);
        }
    }

    /** Clean up a raw command and dispatch it to the correct handler
     *
     * @param {Discord.Message} message
    */
    handleCommand(message) {
        // Isolate the command name (lowercased) and it's argument (in an array)
        const args = message.content.slice(this.config.prefix.length).split(/ +/);
        const commandName = args.shift().toLowerCase();

        // Dispatch to the correct handler, if any
        if (!this.commands.has(commandName) && !this.game_commands.has(commandName)) {
            return message.reply(`je ne connais pas la commande "${this.config.prefix}${commandName}".`);
        }

        // Get the correct command
        var command;
        if (this.commands.has(commandName)) {
            command = this.commands.get(commandName);
        } else {
            command = this.game_commands.get(commandName);
        }

        if (args.length < command.minArgs) {
            this.bufferizeText("il manque un ou plusieurs paramètre");
            this.bufferizeText(`usage : \`${command.usage}\``)

            return message.reply(this.flushBufferToString());
        }
        command.execute(message, args, this);
    }

    /**
     * Save some text to form a sendable message for later
     *
     * @param {String} text
     */
    bufferizeText(text) {
        this.textBuffer += text + "\n";
    }

    /** Get the content of the text buffer in a string and reset it */
    flushBufferToString() {
        const text = this.textBuffer;
        this.textBuffer = "";

        return text;
    }

    /** Get the content of the text buffer in a new `Discord.richEmbed` and reset it */
    flushBufferToEmbed() {
        // Create the embed and fill its content with our buffer
        var embed = new Discord.RichEmbed();
        embed.setDescription(this.textBuffer);

        // reset the buffer
        this.textBuffer = "";

        return embed;
    }

    /** Log in to discord */
    run() {
        this.login(this.config.token);
    }
}

module.exports.Client = Client;