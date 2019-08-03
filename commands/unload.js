const Hector = require("../hector.js");
const Discord = require("discord.js");

module.exports = {
    name: "unload",
    description: "décharge le jeu en cours",
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
        if (!client.game) {
            return message.reply("aucun jeu n'est actuellement chargé")
        }

        client.unloadGame(message);
    },
};
