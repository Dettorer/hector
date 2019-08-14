import * as Hector from "hector";
import * as Discord from "discord.js";

// The command's informations
export const name = "unload";
export const description = "décharge le jeu en cours";
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
    if (!client.game) {
        return message.reply("aucun jeu n'est actuellement chargé");
    }
    client.unloadGame(message);
}
