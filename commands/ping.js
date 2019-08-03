const Hector = require("../hector.js");
const Discord = require("discord.js");

module.exports = {
    name: "ping",
    description: "demande au bot de vous répondre",
    usage: "[<message>]",
    minArgs: 0,
    help: "permet par exemple de vérifier qu\'il n\'a pas planté",

    /**
     * Handle the command
     *
     * @param {Hector.Client} client - the bot object
     * @param {Discord.Message} message - the user message that invoked the command
     * @param {Array<String>} args - the arguments the user gave to the command
     */
    execute(message, args, client) {
        if (!args.length) {
            return message.reply('pong');
        }
        return message.reply(`pong ${args.join(' ')}`)
    },
};
