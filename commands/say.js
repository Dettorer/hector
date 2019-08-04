const Hector = require("../hector.js");
const Discord = require("discord.js");

module.exports = {
    name: "say",
    description: "fait dire quelque chose au bot",
    usage: "<message>",
    minArgs: 1,
    help: "",

    /**
     * Handle the command
     *
     * @param {Hector.Client} client - the bot object
     * @param {Discord.Message} message - the user message that invoked the command
     * @param {Array<String>} args - the arguments the user gave to the command
     */
    execute(message, args, client) {
        return message.channel.send(args.join(' '))
    },
};
