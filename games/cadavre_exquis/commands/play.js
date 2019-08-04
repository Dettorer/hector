const Hector = require("../../../hector.js");
const Discord = require("discord.js");

module.exports = {
    name: "play",
    description: "rejoint les prochaînes parties",
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
        if (!client.game.pendingPlayers.has(message.author.id)) {
            client.game.pendingPlayers.add(message.author.id);
            return message.reply("Ok, je note pour la prochaîne partie");
        }
    }
}
