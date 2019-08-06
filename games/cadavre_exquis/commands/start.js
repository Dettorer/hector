import Hector from "../../../hector.js";
import Discord from "discord.js";

// The command's informations
export const name = "start";
export const description = "démarre la partie";
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
    if (client.game.pendingPlayers.size < 3) {
        return message.reply("Désolé, il faut au moins trois personnes pour jouer.");
    }
    client.game.start(client, message);
}
