import Hector from "../../../hector.js";
import Discord from "discord.js";

// The command's informations
export const name = "play";
export const description = "rejoint les prochaînes parties";
export const usage = "";
export const minArgs = 0;
export const help = "";

/**
 * Handle the command
 *
 * @param {Hector} client - the bot object
 * @param {Discord.Message} message - the user message that invoked the command
 * @param {Array<String>} args - the arguments the user gave to the command
 */
export function execute(message, args, client) {
    if (!client.game.pendingPlayers.has(message.author.id)) {
        client.game.pendingPlayers.add(message.author.id);
        return message.reply("Ok, je note pour la prochaîne partie");
    } else {
        return message.reply("C'est déjà noté");
    }
}
