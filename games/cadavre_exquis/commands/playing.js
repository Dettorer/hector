const Hector = require("../../../hector.js");
const Discord = require("discord.js");

module.exports = {
    name: "playing",
    description: "liste les gens qui veulent jouer",
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
        if (client.game.pendingPlayers.size === 0) {
            return message.channel.send("Personne ne joue.");
        }

        client.bufferizeText(`Il y a ${client.game.pendingPlayers.size} personnes prêtes à jouer:`);
        for (let id of client.game.pendingPlayers) {
            client.bufferizeText(message.channel.members.get(id).displayName);
        }

        return message.channel.send(client.flushBufferToString());
    }
}
