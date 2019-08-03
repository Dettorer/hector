const Hector = require("../hector.js");
const Discord = require("discord.js");

module.exports = {
    name: "list_games",
    description: "liste les jeux disponibles",
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
        for (var game of client.available_games.array()) {
            client.bufferizeText(`\`${game.short_name}\` : **${game.name}** - ${game.short_description}`)
        }

        var embed = client.flushBufferToEmbed();
        embed.setTitle("Je connais les jeux suivants :");
        message.channel.send(embed);
    },
};
