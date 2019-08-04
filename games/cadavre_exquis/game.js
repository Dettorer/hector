const Hector = require("../../hector.js");
const Discord = require("discord.js");
const Data = require("./data.json");

/**
 * Start a session of the game
 *
 * @param {Hector.Client} client - the bot object
 * @param {Discord.Message} message - the message that made the bot start that game
 */
function start(client, message) {
    message.channel.send("C'est parti, lisez vos messages privés pour savoir quoi m'envoyer.")
}

/**
 * Initialize needed data for the game
 *
 * @param {Hector.Client} client - the bot object
 * @param {Discord.Message} message - the message that made the bot start that game, if available
 */
function load(client, message = null) {
    client.game.pendingPlayers = new Set();
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
