import * as Hector from "hector";
import * as Discord from "discord.js";

// The command's informations
export const name = "about";
export const description = "affiche des informations génériques sur le bot";
export const usage = "";
export const minArgs = 0;
export const help = "";

/**
* Handle the command
*
* @param client - the bot object
* @param message - the user message that invoked the command
* @param args - the arguments the user gave to the command
*/
export function execute(message: Discord.Message, args: Array<string>, client: Hector.Client) {
    client.bufferizeLine("Hector est un bot discord développé par Paul \"Dettorer\" Hervot sous license AGPLv3.");
    client.bufferizeLine("Source, informations et signalement de bugs sur github : https://github.com/Dettorer/hector");
    return message.channel.send(client.flushBufferToString());
}
