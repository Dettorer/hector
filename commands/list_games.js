import Hector from "../hector.js";
import Discord from "discord.js";

// The command's informations
export const name = "list_games";
export const description = "liste les jeux disponibles";
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
    for (var game of client.available_games.array()) {
        client.bufferizeText(`\`${game.short_name}\` : **${game.name}** - ${game.short_description}`);
    }
    var embed = client.flushBufferToEmbed();
    embed.setTitle("Je connais les jeux suivants :");
    message.channel.send(embed);
}
