import Hector from "../../hector.js";
import Discord from "discord.js";
import Data from "./data.js";
import Lodash from "lodash";

// The game's informations
export const short_name = 'cadavre';
export const name = '(WIP) cadavre exquis';
export const short_description = 'Jeux de construction de phrase à collaboration aveugle';
export const path = './games/cadavre_exquis';

/**
 * Compute the index to use for Data's examples for a gender and a number
 *
 * @param {String} gender
 * @param {String} number
 */
function exampleIndex(gender, number) {
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
 * @param {Hector} client - the bot object
 * @param {Discord.Message} message - the message that made the bot start that game
 * @param {Array<String>} mode - the current game's mode (assigned sentence parts)
 */
function sendInstructions(client, message, mode) {
    for (const playerId of client.game.assignments.keys()) {
        const assignment = client.game.assignments.get(playerId);
        // Get the users' handle
        const player = message.channel.members.get(playerId);

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
 * @param {Hector} client - the bot object
 * @param {Discord.Message} message - the message that made the bot start that game
 */
export function start(client, message) {
    // load-lock the client and register we're in a game
    client.loadLocked = true;
    client.game.playing = true;
    // clone the pendingPlayers array using the spread operator, then shuffle it
    const players = Lodash.shuffle([...client.game.pendingPlayers]);

    // Save the channel we're in for the endGame function
    client.game.channel = message.channel;

    // Decide gender and number for the sentence.
    const subjectGender = Lodash.sample(["masculin", "féminin"]);
    const subjectNumber = Lodash.sample(["singulier", "pluriel"]);
    const complementGender = Lodash.sample(["masculin", "féminin"]);
    const complementNumber = Lodash.sample(["singulier", "pluriel"]);

    // Assign parts to players
    const mode = Data.modes.get(players.length);
    client.game.assignments = new Discord.Collection();
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
        client.game.assignments.set(player, assignment);

        i++;
    }

    // Generate and give instructions to players in DM
    sendInstructions(client, message, mode);
    client.game.partsMissing = players.length;

    // TODO (later) time management

    message.channel.send("C'est parti, lisez vos messages privés pour savoir quoi m'envoyer !")
}

/**
 * Display the constructed sentence in the game channel
 *
 * @param {Hector} client - the bot object
 */
function endGame(client) {
    client.game.channel.send("Tout le monde m'a donné sa partie ! Voici votre création :");

    // Merge the sentence
    for (const assignment of client.game.assignments) {
        client.bufferizeText(assignment[1].response + " ");
    }

    // Send it in an embed
    client.game.channel.send(client.flushBufferToEmbed());

    // Unlock the game
    client.game.playing = false;
    client.loadLocked = false;
}

/**
 * Handle a private message from a user.
 * If it's a contribution for an ongoing game, save it.
 * If it's the last contribution we were waiting for, also end the game.
 *
 * @param {Hector} client - the bot object
 * @param {Discord.Message} message - the private message
 */
export function handleDM(client, message) {
    // If this user has no reason to send us a DM right now, tell them why
    if (!client.game.pendingPlayers.has(message.author.id)) {
        return message.reply(`Vous n'avez pas rejoins de partie, vous pouvez utiliser la commande ${client.config.prefix}play sur le salon de jeu pour rejoindre la prochaîne.`);
    }
    if (!client.game.playing) {
        return message.reply(`Vous avez bien rejoint la prochaîne partie, mais celle-ci n'a pas encore commencé. Si suffisament de personnes sont prêtes, utilisez la commande ${client.config.prefix}start sur le salon de jeu pour en lancer une.`);
    }

    // It's a user giving us their contribution, we need to save it

    // Acknowledge the reception to the user
    message.reply("Bien reçu.");
    var assignment = client.game.assignments.get(message.author.id)
    if (!assignment.response) {
        // If the user didn't give a contribution for this game, register that
        // there is one less contribution to wait for, and announce it on the
        // game channel
        client.game.partsMissing--;
        client.game.channel.send(`${message.author.username} m'a donné sa partie.`);
    }
    assignment.response = message.content;

    if (client.game.partsMissing === 0) {
        endGame(client);
    }
}

/**
 * Initialize needed data for the game
 *
 * @param {Hector} client - the bot object
 * @param {Discord.Message} message - the message that made the bot start that game, if available
 */
export function load(client, message = null) {
    client.game.pendingPlayers = new Set(); // Users who want to play in the next game
    client.game.playing = false; // true if we're currently in a game
}

/**
 * End the current game and clean up our data. This can be called because the game ended or because we want to abort it (so it can happen anytime).
 *
 * @param {Discord.Message} message - the message that made the bot start that game, if available
 */
export function unload(message = null) {
}
