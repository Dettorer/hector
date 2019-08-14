import * as Hector from "../../hector";
import * as Discord from "discord.js";
import Data from "./data";
import Lodash from "lodash";

interface Assignment {
    part: string;
    gender: string;
    number: string;
    response: string | null;
}

export class Game extends Hector.Game {
    // The game's informations
    short_name = 'cadavre';
    name = '(WIP) cadavre exquis';
    short_description = 'Jeux de construction de phrase à collaboration aveugle';
    path = './games/cadavre_exquis';

    // Our custom informations
    pendingPlayers: Set<Discord.Snowflake> = new Set();
    channel: Discord.TextChannel | undefined = undefined;

    assignments: Discord.Collection<Discord.Snowflake, Assignment> = new Discord.Collection();
    playing: boolean = false;
    currentPlayers: Set<Discord.Snowflake> = new Set();
    partsMissing: number = 0;

    /**
     * Compute the index to use for Data's examples for a gender and a number
     *
     * @param gender
     * @param number
     */
    exampleIndex(gender: string, number: string) {
        var index = 0;
        if (gender === "masculin") {
            index += 2;
        }
        if (number === "singulier") {
            index += 1;
        }
        return index;
    }

    /**
     * Send instructions to players after they have been assigned a part in the sentence
     *
     * @param message - the message that made the bot start that game
     * @param mode - the current game's mode (assigned sentence parts)
     */
    sendInstructions(message: Discord.Message, mode: Array<string>) {
        for (const playerId of this.assignments.keys()) {
            // Ensure we are in a text channel, so we can use its member list
            const channel = message.channel;
            if (!(channel instanceof Discord.TextChannel)) {
                console.warn("cadavre's kick command was called inside a DM, ignoring and warning the user");
                return message.reply("Cette commande doit être utilisée dans le salon de jeu, pas en privé");
            }

            const assignment = this.assignments.get(playerId);
            if (!assignment) {
                return this.client.crash("cadavre: we used a bad playerId for the assignments collection", message.channel);
            }

            // Get the users' handle
            const player = channel.members.get(playerId);
            if (!player) {
                return this.client.crash(`cadavre: a player that isn't in the current channel was given an assignment`, message.channel);
            }

            // Send the instructions
            var partTune = "";
            if (assignment.part === "V") {
                partTune = ` conjugué à la 3e personne, au ${assignment.gender} ${assignment.number}`;
            } else if (assignment.part !== "Cc") {
                partTune = ` accordé au ${assignment.gender} ${assignment.number}`;
            }
            const instructions = `Donne-moi un ${Data.parts.get(assignment.part)}${partTune} convenant à une phrase ressemblant à :`;

            // Send the example
            for (const part of mode) {
                const partExamples = Data.examples.get(part);
                if (!partExamples) {
                    const errorMsg = `cadavre: Data doesn't have examples for part ${part}`;
                    return this.client.crash(errorMsg, message.channel);
                }
                const variantIndex = this.exampleIndex(assignment.gender, assignment.number);

                if (part === assignment.part) {
                    this.client.bufferizeText("**");
                }
                this.client.bufferizeText(partExamples[variantIndex]);
                if (part === assignment.part) {
                    this.client.bufferizeText("** ");
                } else {
                    this.client.bufferizeText(" ");
                }
            }
            player.send(instructions);
            player.send(this.client.flushBufferToEmbed());
        }
    }

    /**
     * Start a session of the game
     *
     * @param message - the message that made the bot start that game
     */
    start(message: Discord.Message) {
        // Ensure we are in a text channel
        const channel = message.channel;
        if (!(channel instanceof Discord.TextChannel)) {
            console.warn("cadavre's kick command was called inside a DM, ignoring and warning the user");
            return message.reply("Cette commande doit être utilisée dans le salon de jeu, pas en privé");
        }

        // load-lock the client and register we're in a game
        this.client.loadLocked = true;
        this.playing = true;
        // clone the pendingPlayers array using the spread operator, then shuffle it
        const players = Lodash.shuffle([...this.pendingPlayers]);
        // and save it in the client as a set
        this.currentPlayers = new Set(players);

        // Save the channel we're in for the endGame function
        this.channel = channel;

        // Decide gender and number for the sentence.
        const subjectGender = Lodash.sample(["masculin", "féminin"])!;
        const subjectNumber = Lodash.sample(["singulier", "pluriel"])!;
        const complementGender = Lodash.sample(["masculin", "féminin"])!;
        const complementNumber = Lodash.sample(["singulier", "pluriel"])!;

        // Assign parts to players
        const mode = Data.modes.get(players.length);
        if (!mode) {
            const errorMsg = `cadavre: no game mode for ${players.length} players, it should have been checked before.`;
            return this.client.crash(errorMsg, message.channel);
        }
        this.assignments = new Discord.Collection();
        var i = 0;
        for (const part of mode) {
            const player = players[i];

            var gender;
            var number;
            if (Data.subjectParts.has(part)) {
                gender = subjectGender;
                number = subjectNumber
            } else {
                gender = complementGender;
                number = complementNumber;
            }

            var assignment: Assignment = {
                part: part,
                gender: gender,
                number: number,
                response: null
            };
            this.assignments.set(player, assignment);

            i++;
        }

        // Generate and give instructions to players in DM
        this.sendInstructions(message, mode);
        this.partsMissing = players.length;

        // TODO (later) time management

        message.channel.send("C'est parti, lisez vos messages privés pour savoir quoi m'envoyer !")
    }

    /**
     * Display the constructed sentence in the game channel
     *
     * @param client - the bot object
     */
    endGame() {
        if (!this.channel) {
            return this.client.crash("cadavre: endGame: no channel were setup in the game object");
        }
        this.channel.send("Tout le monde m'a donné sa partie ! Voici votre création :");

        // Merge the sentence
        for (const assignment of this.assignments) {
            this.client.bufferizeText(assignment[1].response + " ");
        }

        // Send it in an embed
        this.channel.send(this.client.flushBufferToEmbed());

        // Unlock and clean the game
        this.client.loadLocked = false;
        this.assignments = new Discord.Collection();
        this.playing = false;
        this.currentPlayers = new Set();
        this.partsMissing = 0;
    }

    /**
     * Handle a private message from a user.
     * If it's a contribution for an ongoing game, save it.
     * If it's the last contribution we were waiting for, also end the game.
     *
     * @param message - the private message
     */
    handleDM(message: Discord.Message) {
        // If this user has no reason to send us a DM right now, tell them why
        const isPending = this.pendingPlayers.has(message.author.id);
        const isCurrent = this.playing && this.currentPlayers.has(message.author.id);
        if (!isPending && !isCurrent) {
            return message.reply(`Vous n'avez pas rejoint de partie, vous pouvez utiliser la commande ${this.client.config.prefix}play sur le salon de jeu pour rejoindre la prochaîne.`);
        }
        if (isPending && !isCurrent) {
            return message.reply(`Vous avez bien rejoint la prochaîne partie, mais celle-ci n'a pas encore commencé. Si suffisament de personnes sont prêtes, utilisez la commande ${this.client.config.prefix}start sur le salon de jeu pour en lancer une.`);
        }

        // It's a user giving us their contribution, we need to save it
        if (!this.channel) {
            return this.client.crash("cadavre: handleDM: we're trying to save a contribution but no channel was setup in the game object", message.channel);
        }

        // Acknowledge the reception to the user
        message.reply("Bien reçu.");
        var assignment = this.assignments.get(message.author.id)
        if (!assignment) {
            return this.client.crash("cadavre: handleDM: user doesn't have an assignment but we still tried to find one despite checking for that", message.channel);
        }
        if (!assignment.response) {
            // If the user didn't give a contribution for this game, register that
            // there is one less contribution to wait for, and announce it on the
            // game channel
            this.partsMissing--;
            this.channel.send(`${message.author.username} m'a donné sa partie.`);
        }
        assignment.response = message.content;

        if (this.partsMissing === 0) {
            this.endGame();
        }
    }

    /**
     * Initialize needed data for the game
     */
    load() {
        this.pendingPlayers = new Set();
        this.channel = undefined;
    }

    /**
     * End the current game and clean up our data. This can be called because the game ended or because we want to abort it (so it can happen anytime).
     */
    unload() {
        this.pendingPlayers = new Set();
        this.channel = undefined;
    }
}
