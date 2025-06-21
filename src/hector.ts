import * as Discord from "discord.js";
import * as fs from "fs";
import {NullLiteral} from "typescript";

export abstract class Command {
    abstract readonly str: string;
    abstract readonly description: string;
    abstract readonly usage: string;
    abstract readonly minArgs: number;
    abstract readonly help: string;

    abstract execute(message: Discord.Message, args: Array<string>): void;

    readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }
}

export abstract class Game {
    abstract readonly short_name: string;
    abstract readonly name: string;
    abstract readonly short_description: string;
    abstract readonly path: string;

    abstract handleDM(message: Discord.Message): void;
    abstract load(message: Discord.Message | null): void;
    abstract unload(message: Discord.Message | null): void;

    readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }
}

export interface IConfig {
    token: string;
    prefix: string;
    guild: string;
    channel: string;
    commandsPath: string;
    gamesPath: string;
}

export class Client extends Discord.Client {
    commands: Discord.Collection<string, Command>;
    game_commands: Discord.Collection<string, Command>;

    available_games: Discord.Collection<string, Game>;
    game: Game | null;

    config: IConfig;
    channel: Discord.SendableChannels | null;

    loadLocked: boolean;

    textBuffer: string;

    /**
     * Creates a new Hector bot and load its configuration
     *
     * @constructor
     * @param config: the bot's configuration
     */
    constructor(config: IConfig, options: Discord.ClientOptions) {
        // Call parent's (discord.js') constructor
        super(options);

        this.config = config;

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

        this.channel = null;
    }

    /**
     * Load the bot's configuration, register commands and games, and finally set Discord hooks.
     *
     * @param configPath - The path to configuration file
     * @param commandsPath - An optional path to load general purpose commands from (those can be loaded later by manually calling `registerCommands`)
     * @param gamesPath - An optional path to load the games from (those can be loaded later by manually calling `registerGames`)
     */
    async init() {
        // Load the general purpose commands and available games
        await this.registerCommands(this.config.commandsPath);
        await this.registerGames(this.config.gamesPath);

        this.setHooks();
    }

    /** Set "ready" and "message" hooks */
    setHooks() {
        // When the bot is ready, log it.
        this.once(Discord.Events.ClientReady, client => {
            console.log(`Ready! Logged in as ${client.user.tag}`);

            // Set the configured channel
            const channel = this.channels.cache.get(this.config.channel);
            if (channel === undefined)
                throw "cannot find the configured channel"
            else if (!channel.isSendable())
                throw "the configured channel is not sendable";
            this.channel = channel;
        });

        this.on(Discord.Events.MessageCreate, message => {
            // Ignore the message if not in the correct channel, or a private message
            if (!message.channel.isDMBased() && message.channel.id !== this.config.channel) {
                return;
            }

            // Log every message received on channels we listen for
            var logLine = "";
            if (message.channel.isDMBased()) {
                logLine += "DM ";
            }
            logLine += `<${message.author.username}`;
            if (message.channel.isDMBased() && message.author.id === this.user?.id) {
                var channel = message.channel as Discord.DMChannel;
                logLine += ` -> ${channel.recipient?.username}`;
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
            if (message.channel.isDMBased()) {
                return this.handleDM(message);
            }

            // Determine if the message is a command and handle it.
            if (message.content.startsWith(`${this.config.prefix}`)) {
                this.handleCommand(message);
            }
        });
    }

    /**
     * Find the general commands and register their handler in the client (indexed by the command's name, without the command prefix).
     *
     * @param path - the path in which we'll search for commands to load. If it's relative to the working directory, it must start with "./"
     * @param game - weather these commands are specific to the current loaded game or not
     */
    async registerCommands(path: string, game: boolean = false) {
        const commandFiles = fs.readdirSync(`${path}`).filter(file => file.endsWith(".js"));
        for (const file of commandFiles) {
            const mod = await import(`${path}/${file}`);
            const command = new mod.Command(this);

            if (game) {
                this.game_commands.set(command.str, command);
            } else {
                this.commands.set(command.str, command);
            }

            // If the command has an initialization function, schedule it to be
            // run when the client is ready.
            if (typeof command['init'] === 'function') {
                this.once(Discord.Events.ClientReady, async () => {
                    await command.init();
                });
            }
        }
    }

    /**
     * Find the available games and register their handler in the client (indexed by the game's name).
     *
     * @param path - the path in which we'll search for games to register. If it's relative to the working directory, it must start with "./"
     */
    async registerGames(path: string) {
        const gameDirs = fs.readdirSync(`${path}`, {withFileTypes: true}).filter(dirent => dirent.isDirectory());
        for (const dir of gameDirs) {
            const mod = await import(`${path}/${dir.name}/game.js`);
            const game = new mod.Game(this);

            this.available_games.set(game.short_name, game);
        }
    }

    /**
     * Set up a game
     *
     * @param gameName - the name of the game
     * @param message - the message that prompted the loading of that game, if available
     */
    async loadGame(gameName: string, message: Discord.Message | null = null) {
        let game = this.available_games.get(gameName);
        if (!game) {
            if (message) {
                message.reply(`Je ne connais pas le jeu "${gameName}"`);
            }
            throw new Error(`Je ne connais pas le jeu \`${gameName}\``);
        }

        // save the game object
        this.game = game;

        console.log(`loading the game "${game.name}`);
        await this.registerCommands(`${game.path}/commands`, true);
        game.load(message);

        return game;
    }

    /**
     * Get rid of the game setup
     *
     * @param message - the message that prompted the loading of that game, if available
     */
    unloadGame(message: Discord.Message | null = null) {
        if (!this.game) { // No game is loaded
            return console.log("Warning: no game was loaded but unloadGame was called")
        }

        console.log(`unloading the game "${this.game.name}`)
        if (message && message.channel.isSendable()) {
            message.channel.send(`Je ferme le jeu "${this.game.name}"`)
        }
        this.game.unload(message);
        this.game = null;
        this.game_commands = new Discord.Collection();
    }

    /**
     * Assemble a full usage string for a given command by assembling the
     * configured command prefix, the command's name and the command's own usage
     * string.
     *
     * @param command - the command for which to assemble the usage string
     */
    getCommandUsage(command: Command) {
        let usage = `${this.config.prefix}${command.str}`;
        if (command.usage != "") {
            usage += ` ${command.usage}`;
        }

        return usage;
    }

    /**
     * Call the current's game DM handler if a game is loaded, explain the
     * situation to the user otherwise.
     */
    handleDM(message: Discord.Message) {
        if (this.game) {
            return this.game.handleDM(message);
        }

        return message.reply("Aucun jeu n'est chargé, je ne regarde pas les messages privés.")
    }

    /** Clean up a raw command and dispatch it to the correct handler
     *
     * @param message
    */
    handleCommand(message: Discord.Message) {
        // Isolate the command name (lowercased) and its argument (in an array)
        const args = message.content.slice(this.config.prefix.length).split(/ +/);
        const rawCommandName = args.shift();
        if (!rawCommandName) {
            // The user sent a message starting with our command prefix but not command following, ignore the message
            return ;
        }
        const commandName = rawCommandName.toLowerCase();

        // Get the correct command
        var command = this.commands.get(commandName);
        if (!command) {
            command = this.game_commands.get(commandName);
        }
        if (!command) {
            return message.reply(`je ne connais pas la commande "${this.config.prefix}${commandName}".`);
        }

        if (args.length < command.minArgs) {
            this.bufferizeLine("il manque un ou plusieurs paramètre");
            this.bufferizeLine(`usage : \`${this.getCommandUsage(command)}\``)

            return message.reply(this.flushBufferToString());
        }
        command.execute(message, args);
    }

    /**
     * Save some text to form a sendable message for later (without a newline)
     *
     * @param text
     */
    bufferizeText(text: string) {
        this.textBuffer += text;
    }

    /**
     * Save a line of text to form a sendable message for later
     *
     * @param text
     */
    bufferizeLine(text: string) {
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
        var embed = new Discord.EmbedBuilder().setDescription(this.textBuffer);

        // reset the buffer
        this.textBuffer = "";

        return embed;
    }

    crash(description: string, channel: Discord.SendableChannels | null = null) {
        console.error(description);
        console.error("crashing");
        channel?.send(`Erreur fatale (${description})`);
        throw new Error(description);
    }

    /** Log in to discord */
    run() {
        this.login(this.config.token);
    }
}

function startClient(config: IConfig) {
    let client = new Client(config, {
        intents: [
            Discord.GatewayIntentBits.Guilds,
            Discord.GatewayIntentBits.GuildMessages,
            Discord.GatewayIntentBits.DirectMessages,
            Discord.GatewayIntentBits.MessageContent,
            Discord.GatewayIntentBits.GuildMembers,
        ],
        partials: [
            Discord.Partials.Channel,
        ],
        allowedMentions: {
            parse: [
                Discord.AllowedMentionsTypes.Everyone,
                Discord.AllowedMentionsTypes.Role,
                Discord.AllowedMentionsTypes.User,
            ],
        },
    });

    client.init()
        .then(() => client.run());
}

if (require.main === module) {
    // Load the configuration
    import("./config.json")
        .then((config: IConfig) => startClient(config));
}
