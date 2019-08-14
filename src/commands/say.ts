import * as Hector from "hector";
import * as Discord from "discord.js";

// The command's informations
export const name = "say";
export const description = "fait dire quelque chose au bot";
export const usage = "<message>";
export const minArgs = 1;
export const help = "";

/**
 * Handle the command
 *
 * @param client - the bot object
 * @param message - the user message that invoked the command
 * @param args - the arguments the user gave to the command
 */
export function execute(message: Discord.Message, args: Array<string>, client: Hector.Client) {
    return message.channel.send(args.join(' '));
}
