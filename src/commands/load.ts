import * as Hector from "hector";
import * as Discord from "discord.js";

// The command's informations
export const name = "load";
export const description = "charge le jeu demandé";
export const usage = "<jeu>";
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
    if (client.game && client.loadLocked) {
        return message.reply(`Un jeu (${client.game.name}) est en cours, il faut d'abord le quitter.`); // TODO: make an abort command that kills a game and unload it
    }
    else if (client.game && !client.loadLocked) {
        client.unloadGame(message);
    }
    else {
        client.loadGame(args[0], message)
            .then((game: Hector.IGame) => message.channel.send(`J'ouvre le jeu \`${game.name}\` !`))
            .catch((error: Error) => message.reply(error.message));
    }
}
