import * as Hector from "hector";
import * as Discord from "discord.js";

// The command's informations
export const name = "ping";
export const description = "demande au bot de vous répondre";
export const usage = "[<message>]";
export const minArgs = 0;
export const help = "permet par exemple de vérifier qu\'il n\'a pas planté";

/**
 * Handle the command
 *
 * @param client - the bot object
 * @param message - the user message that invoked the command
 * @param args - the arguments the user gave to the command
 */
export function execute(message: Discord.Message, args: Array<string>, client: Hector.Client) {
    if (!args.length) {
        return message.reply('pong');
    }
    return message.reply(`pong ${args.join(' ')}`);
}
