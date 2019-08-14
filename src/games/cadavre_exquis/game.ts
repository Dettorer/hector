import * as Hector from "hector";
import * as Discord from "discord.js";
import Data from "./data";
import Lodash from "lodash";

// The game's informations
export const short_name = 'cadavre';
export const name = '(WIP) cadavre exquis';
export const short_description = 'Jeux de construction de phrase à collaboration aveugle';
export const path = './games/cadavre_exquis';

/**
 * Compute the index to use for Data's examples for a gender and a number
 *
 * @param gender
 * @param number
 */
function exampleIndex(gender: string, number: string) {
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
 * @param client - the bot object
 * @param message - the message that made the bot start that game
 * @param mode - the current game's mode (assigned sentence parts)
 */
function sendInstructions(client: Hector.Client, message: Discord.Message, mode: Array<string>) {
    // ensure the game object has been initialized
    let game = client.game;
    if (!game) {
        return client.crash("cadavre: handleDM: client.game hasn't been initialized");
    }

    // Ensure we are in a text channel, so we can use its member list
    const channel = message.channel;
    if (!(channel instanceof Discord.TextChannel)) {
        console.warn("cadavre's kick command was called inside a DM, ignoring and warning the user");
        return message.reply("Cette commande doit être utilisée dans le salon de jeu, pas en privé");
    }

    for (const playerId of game.assignments.keys()) {
        const assignment = game.assignments.get(playerId);

        // Get the users' handle
        const player = channel.members.get(playerId);
        if (!player) {
            return client.crash(`cadavre: a player that isn't in the current channel was given an assignment`);
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
                return client.crash(errorMsg, channel);
            }
            const variantIndex = exampleIndex(assignment.gender, assignment.number);

            if (part === assignment.part) {
                client.bufferizeText("**");
            }
            client.bufferizeText(partExamples[variantIndex]);
            if (part === assignment.part) {
                client.bufferizeText("** ");
            } else {
                client.bufferizeText(" ");
            }
        }
        player.send(instructions);
        player.send(client.flushBufferToEmbed());
    }
}

/**
 * Start a session of the game
 *
 * @param client - the bot object
 * @param message - the message that made the bot start that game
 */
export function start(client: Hector.Client, message: Discord.Message) {
    // ensure the game object has been initialized
    let game = client.game;
    if (!game) {
        return client.crash("cadavre: handleDM: client.game hasn't been initialized");
    }

    // load-lock the client and register we're in a game
    client.loadLocked = true;
    game.playing = true;
    // clone the pendingPlayers array using the spread operator, then shuffle it
    const players = Lodash.shuffle([...game.pendingPlayers]);
    // and save it in the client as a set
    game.currentPlayers = new Set(players);

    // Save the channel we're in for the endGame function
    game.channel = message.channel;

    // Decide gender and number for the sentence.
    const subjectGender = Lodash.sample(["masculin", "féminin"]);
    const subjectNumber = Lodash.sample(["singulier", "pluriel"]);
    const complementGender = Lodash.sample(["masculin", "féminin"]);
    const complementNumber = Lodash.sample(["singulier", "pluriel"]);

    // Assign parts to players
    const mode = Data.modes.get(players.length);
    if (!mode) {
        const errorMsg = `cadavre: no game mode for ${players.length} players, it should have been checked before.`;
        return client.crash(errorMsg, message.channel);
    }
    game.assignments = new Discord.Collection();
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

        var assignment = {
            part: part,
            gender: gender,
            number: number,
            response: null
        };
        game.assignments.set(player, assignment);

        i++;
    }

    // Generate and give instructions to players in DM
    sendInstructions(client, message, mode);
    game.partsMissing = players.length;

    // TODO (later) time management

    message.channel.send("C'est parti, lisez vos messages privés pour savoir quoi m'envoyer !")
}

/**
 * Display the constructed sentence in the game channel
 *
 * @param client - the bot object
 */
function endGame(client: Hector.Client) {
    // ensure the game object has been initialized
    let game = client.game;
    if (!game) {
        return client.crash("cadavre: endGame: client.game hasn't been initialized");
    }

    game.channel.send("Tout le monde m'a donné sa partie ! Voici votre création :");

    // Merge the sentence
    for (const assignment of game.assignments) {
        client.bufferizeText(assignment[1].response + " ");
    }

    // Send it in an embed
    game.channel.send(client.flushBufferToEmbed());

    // Unlock and clean the game
    game.currentPlayers = null;
    game.playing = false;
    client.loadLocked = false;
}

/**
 * Handle a private message from a user.
 * If it's a contribution for an ongoing game, save it.
 * If it's the last contribution we were waiting for, also end the game.
 *
 * @param client - the bot object
 * @param message - the private message
 */
export function handleDM(client: Hector.Client, message: Discord.Message) {
    // ensure the game object has been initialized
    let game = client.game;
    if (!game) {
        return client.crash("cadavre: handleDM: client.game hasn't been initialized");
    }

    // If this user has no reason to send us a DM right now, tell them why
    const isPending = game.pendingPlayers.has(message.author.id);
    const isCurrent = game.playing && game.currentPlayers.has(message.author.id);
    if (!isPending && !isCurrent) {
        return message.reply(`Vous n'avez pas rejoint de partie, vous pouvez utiliser la commande ${client.config.prefix}play sur le salon de jeu pour rejoindre la prochaîne.`);
    }
    if (isPending && !isCurrent) {
        return message.reply(`Vous avez bien rejoint la prochaîne partie, mais celle-ci n'a pas encore commencé. Si suffisament de personnes sont prêtes, utilisez la commande ${client.config.prefix}start sur le salon de jeu pour en lancer une.`);
    }

    // It's a user giving us their contribution, we need to save it

    // Acknowledge the reception to the user
    message.reply("Bien reçu.");
    var assignment = game.assignments.get(message.author.id)
    if (!assignment.response) {
        // If the user didn't give a contribution for this game, register that
        // there is one less contribution to wait for, and announce it on the
        // game channel
        game.partsMissing--;
        game.channel.send(`${message.author.username} m'a donné sa partie.`);
    }
    assignment.response = message.content;

    if (game.partsMissing === 0) {
        endGame(client);
    }
}

/**
 * Initialize needed data for the game
 *
 * @param client - the bot object
 * @param message - the message that made the bot start that game, if available
 */
export function load(client: Hector.Client, message: Discord.Message) {
    // ensure the game object has been initialized
    let game = client.game;
    if (!game) {
        return client.crash("cadavre: load: client.game hasn't been initialized");
    }

    game.pendingPlayers = new Set(); // Users who want to play in the next game
    game.playing = false; // true if we're currently in a game
}

/**
 * End the current game and clean up our data. This can be called because the game ended or because we want to abort it (so it can happen anytime).
 *
 * @param message - the message that made the bot start that game, if available
 */
export function unload(message: Discord.Message | null = null) {
}
