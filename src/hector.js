import Discord from "discord.js";
import fs from "fs";

export default class Client extends Discord.Client {
    /**
     * Creates a new Hector bot and load its configuration
     *
     * @constructor
     */
    constructor() {
        // Call parent's (discord.js') constructor
        super();

        // Initialize commands collections
        this.commands = new Discord.Collection();
        this.game_commands = new Discord.Collection();

        // TODO: players who are ready to play

        // Put a placeholder for the future loaded game
        this.available_games = new Discord.Collection();
        this.game = null;

        // This boolean will be used by games to signal when they can be safely unloaded (for example, when a match is running, this should be false)
        this.loadLocked = false;

        // Buffer for `bufferizeText`, `flushBufferToString` and `flushBufferToRichEmbed`
        this.textBuffer = "";
    }

    /**
     * Load the bot's configuration, register commands and games, and finally set Discord hooks.
     *
     * @param {String} configPath - The path to configuration file
     * @param {String} commandsPath - An optional path to load general purpose commands from (those can be loaded later by manually calling `registerCommands`)
     * @param {String} gamesPath - An optional path to load the games from (those can be loaded later by manually calling `registerGames`)
     */
    async init(configPath, commandsPath = null, gamesPath = null) {
        // Load the configuration
        this.config = await import(configPath);

        // Load the general purpose commands and available games
        await this.registerCommands(this.config.commandsPath);
        await this.registerGames(this.config.gamesPath);

        this.setHooks();
    }

    /** Set "ready" and "message" hooks */
    setHooks() {
        // When the bot is ready, log it.
        this.once("ready", () => {
            console.log("Ready!");
        });

        this.on("message", message => {
            // Ignore the message if not in the correct channel, or a private message
            if (message.channel.type !== "dm" && message.channel.id !== this.config.channel) {
                return;
            }

            // Log every message that goes to our channel
            var logLine = "";
            if (message.channel.type === "dm") {
                logLine += "DM ";
            }
            logLine += `<${message.author.username}`;
            if (message.channel.type === "dm" && message.author.id === this.user.id) {
                logLine += ` -> ${message.channel.recipient.username}`;
            }
            logLine += `> ${message.content}`;
            console.log(logLine);
            for (const embed of message.embeds) {
                if (embed.title) {
                    console.log(embed.title);
                }
                if (embed.description) {
                    console.log(embed.description);
                }
            }

            // Do not handle the message if it's from a bot (like ourselves)
            if (message.author.bot) {
                return;
            }

            // If it's a private message, send it to the right handler
            if (message.channel.type === "dm") {
                return this.handleDM(message);
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
    async registerCommands(path, game=false) {
        const commandFiles = fs.readdirSync(`${path}`).filter(file => file.endsWith(".js"));
        for (const file of commandFiles) {
            const command = await import(`${path}/${file}`);

            if (game) {
                this.game_commands.set(command.name, command);
            } else {
                this.commands.set(command.name, command);
            }
        }
    }

    /**
     * Find the available games and register their handler in the client (indexed by the game's name).
     *
     * @param {String} path - the path in which we'll search for games to register. If it's relative to the working directory, it must start with "./"
     */
    async registerGames(path) {
        const gameDirs = fs.readdirSync(`${path}`, {withFileTypes: true}).filter(dirent => dirent.isDirectory());
        for (const dir of gameDirs) {
            const game = await import(`${path}/${dir.name}/game.js`);

            this.available_games.set(game.short_name, game);
        }
    }

    /**
     * Set up a game
     *
     * @param {String} gameName - the name of the game
     * @param {Discord.Message} message - the message that prompted the loading of that game, if available
     */
    async loadGame(gameName, message = null) {
        if (!this.available_games.has(gameName)) {
            message.reply(`Je ne connais pas le jeu "${gameName}"`);
        }
        this.game = this.available_games.get(gameName);
        console.log(`loading the game "${this.game.name}`);
        await this.registerCommands(`${this.game.path}/commands`, true);
        this.game.load(this, message);
    }

    /**
     * Get rid of the game setup
     *
     * @param {Discord.Message} message - the message that prompted the loading of that game, if available
     */
    unloadGame(message = null) {
        if (!this.game) { // No game is loaded
            return console.log("Warning: no game was loaded but unloadGame was called")
        }

        console.log(`unloading the game "${this.game.name}`)
        message.channel.send(`Je ferme le jeu "${this.game.name}"`)
        this.game.unload(message);
        this.game = null;
        this.game_commands = new Discord.Collection();
    }

    getCommandUsage(command) {
        var usage = `${this.config.prefix}${command.name}`;
        if (command.usage != "") {
            usage += ` ${command.usage}`;
        }

        return usage;
    }

    handleDM(message) {
        if (this.game) {
            return this.game.handleDM(this, message);
        }

        return message.reply("Aucun jeu n'est chargé, je ne regarde pas les messages privés.")
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
            this.bufferizeLine("il manque un ou plusieurs paramètre");
            this.bufferizeLine(`usage : \`${this.getCommandUsage(command)}\``)

            return message.reply(this.flushBufferToString());
        }
        command.execute(message, args, this);
    }

    /**
     * Save some text to form a sendable message for later (without a newline)
     *
     * @param {String} text
     */
    bufferizeText(text) {
        this.textBuffer += text;
    }

    /**
     * Save a line of text to form a sendable message for later
     *
     * @param {String} text
     */
    bufferizeLine(text) {
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

// @ts-ignore (vscode thinks this condition will always return false, which isn't the case if the file is directly given to node)
if (require.main === module) {
    var client = new Client();

    client.init("./config.json")
        .then(() => client.run());
}
