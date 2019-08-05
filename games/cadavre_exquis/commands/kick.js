const Hector = require("../../../hector.js");
const Discord = require("discord.js");

module.exports = {
    name: "kick",
    description: "effectue la commande `unplay` à la place de quelqu'un d'autre",
    usage: "<personne>",
    minArgs: 1,
    help: "",

    /**
     * Handle the command
     * TODO: only mods should be able to invoke this command
     *
     * @param {Hector.Client} client - the bot object
     * @param {Discord.Message} message - the user message that invoked the command
     * @param {Array<String>} args - the arguments the user gave to the command
     */
    execute(message, args, client) {
        const user = message.channel.members.find(user => user.displayName === args[0]);
        if (!user) {
            return message.reply(`je ne sais pas qui est ${args[0]}.`);
        }

        if (!client.game.pendingPlayers.has(user.id)) {
            return message.reply(`${args[0]} n'a pas dit vouloir jouer.`);
        }

        client.game.pendingPlayers.delete(user.id);
        return message.reply(`Ok, je vire ${args[0]}.`);
    }
}
