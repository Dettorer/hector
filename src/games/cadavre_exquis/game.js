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

        // Bufferize the instructions
        var partTune = "";
        if (assignment.part === "V") {
            partTune = ` conjugué à la 3e personne, au ${assignment.gender} ${assignment.number}`;
        } else if (assignment.part !== "Cc") {
            partTune = ` accordé au ${assignment.gender} ${assignment.number}`;
        }
        client.bufferizeLine(`Donne-moi un ${Data.parts.get(assignment.part)}${partTune} convenant à une phrase ressemblant à :`);

        // Bufferize the example
        client.bufferizeText("\"");
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
        client.bufferizeText("\"");

        player.send(client.flushBufferToString());
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

    // (later) time management

    message.channel.send("C'est parti, lisez vos messages privés pour savoir quoi m'envoyer !")
}

/**
 * Handle a private message from a user
 *
 * @param {Hector} client - the bot object
 * @param {Discord.Message} message - the private message
 */
export function handleDM(client, message) {
    message.reply("C'est pas le moment");
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
