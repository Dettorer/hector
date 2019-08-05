const Hector = require("../../hector.js");
const Discord = require("discord.js");
const Data = require("./data.js");
const Lcollection = require("lodash/collection");

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
 * @param {Hector.Client} client - the bot object
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
            partExamples = Data.examples.get(part);
            variantIndex = exampleIndex(assignment.gender, assignment.number);

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
 * @param {Hector.Client} client - the bot object
 * @param {Discord.Message} message - the message that made the bot start that game
 */
function start(client, message) {
    // load-lock the client and register we're in a game
    client.loadLocked = true;
    client.game.playing = true;
    // clone the pendingPlayers array using the spread operator, then shuffle it
    const players = Lcollection.shuffle([...client.game.pendingPlayers]);

    // Decide gender and number for the sentence.
    const subjectGender = Lcollection.sample(["masculin", "féminin"]);
    const subjectNumber = Lcollection.sample(["singulier", "pluriel"]);
    const complementGender = Lcollection.sample(["masculin", "féminin"]);
    const complementNumber = Lcollection.sample(["singulier", "pluriel"]);

    // Assign parts to players
    const mode = Data.modes.get(players.length);
    client.game.assignments = new Discord.Collection();
    var i = 0;
    for (const part of mode) {
        player = players[i];

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
 * Initialize needed data for the game
 *
 * @param {Hector.Client} client - the bot object
 * @param {Discord.Message} message - the message that made the bot start that game, if available
 */
function load(client, message = null) {
    client.game.pendingPlayers = new Set(); // Users who want to play in the next game
    client.game.playing = false; // true if we're currently in a game
}

/**
 * End the current game and clean up our data. This can be called because the game ended or because we want to abort it (so it can happen anytime).
 *
 * @param {Discord.Message} message - the message that made the bot start that game, if available
 */
function unload(message = null) {
}

/**
 * Handle a private message from a user
 *
 * @param {Hector.Client} client - the bot object
 * @param {Discord.Message} message - the private message
 */
function handleDM(client, message) {
    message.reply("C'est pas le moment");
}

module.exports = {
    short_name: 'cadavre',
    name: '(WIP) cadavre exquis',
    short_description: 'Jeux de construction de phrase à collaboration aveugle',
    path: './games/cadavre_exquis',
    handleDM: handleDM,
    load: load,
    unload: unload,
    start: start
};
