const Hector = require("../../../hector.js");
const Discord = require("discord.js");

module.exports = {
    name: "start",
    description: "démarre la partie",
    usage: "",
    minArgs: 0,
    help: "",

    /**
     * Handle the command
     *
     * @param {Hector.Client} client - the bot object
     * @param {Discord.Message} message - the user message that invoked the command
     * @param {Array<String>} args - the arguments the user gave to the command
     */
    execute(message, args, client) {
        if (client.game.pendingPlayers.size < 3) {
            return message.reply("Désolé, il faut au moins trois personnes pour jouer.");
        }

        client.game.start(client, message);
    }
}
