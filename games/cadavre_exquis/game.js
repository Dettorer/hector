/**
 * Initialize needed data for the game
 *
 * @param {Hector.Client} client - the bot object
 * @param {Discord.Message} message - the message that made the bot start that game, if available
 */
function load(client, message = null) {
}

/**
 * End the current game and clean up our data. This can be called because the game ended or because we want to abort it (so it can happen anytime).
 *
 * @param {Discord.Message} message - the message that made the bot start that game, if available
 */
function unload(message = null) {
    message.channel.send("J'arrête la partie")
}

/**
 * Start a session of the game
 *
 * @param {Hector.Client} client - the bot object
 * @param {Discord.Message} message - the message that made the bot start that game, if available
 */
function play(client, message = null) {
    if (message) {
        console.log(`starting a game of ${this.name}`)
        message.channel.send(`Je lance une partie de ${this.name} !`)
    }
}

module.exports = {
    short_name: 'cadavre',
    name: '(WIP) cadavre exquis',
    short_description: 'Jeux de construction de phrase à collaboration aveugle',
    path: './games/cadavre_exquis',
    load: load,
    unload: unload,
    play: play
};
