import Hector from "../../../hector.js";
import Discord from "discord.js";

// The command's informations
export const name = "kick";
export const description = "effectue la commande `unplay` à la place de quelqu'un d'autre";
export const usage = "<personne>";
export const minArgs = 1;
export const help = "";

/**
 * Handle the command
 * TODO: only mods should be able to invoke this command
 *
 * @param {Hector} client - the bot object
 * @param {Discord.Message} message - the user message that invoked the command
 * @param {Array<String>} args - the arguments the user gave to the command
 */
export function execute(message, args, client) {
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
