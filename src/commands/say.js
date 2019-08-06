import Hector from "../hector.js";
import Discord from "discord.js";

// The command's informations
export const name = "say";
export const description = "fait dire quelque chose au bot";
export const usage = "<message>";
export const minArgs = 1;
export const help = "";

/**
* Handle the command
*
* @param {Hector} client - the bot object
* @param {Discord.Message} message - the user message that invoked the command
* @param {Array<String>} args - the arguments the user gave to the command
*/
export function execute(message, args, client) {
    return message.channel.send(args.join(' '));
}
