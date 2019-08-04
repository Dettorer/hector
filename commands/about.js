const Hector = require("../hector.js");
const Discord = require("discord.js");

module.exports = {
    name: "about",
    description: "affiche des informations génériques sur le bot",
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
        client.bufferizeLine("Hector est un bot discord développé par Paul \"Dettorer\" Hervot.");
        client.bufferizeLine("Source, informations et signalement de bugs sur github : https://github.com/Dettorer/hector");
        return message.channel.send(client.flushBufferToString());
    },
};
