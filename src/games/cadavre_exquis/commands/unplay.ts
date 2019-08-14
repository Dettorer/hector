import * as Hector from "hector";
import * as Discord from "discord.js";

// The command's informations
export const name = "unplay";
export const description = "ne plus être inclus dans les parties suivantes";
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
    // ensure the game object has been initialized
    let game = client.game;
    if (!game) {
        return client.crash("cadavre: handleDM: client.game hasn't been initialized");
    }

    if (game.pendingPlayers.has(message.author.id)) {
        game.pendingPlayers.delete(message.author.id);
        return message.reply("Ok, à plus");
    }
}
