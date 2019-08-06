import Hector from "../hector.js";
import Discord from "discord.js";

// The command's informations
export const name = "load";
export const description = "charge le jeu demandé";
export const usage = "<jeu>";
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
    if (client.game && client.loadLocked) {
        return message.reply(`Un jeu (${client.game.name}) est en cours, il faut d'abord le quitter.`); // TODO: make an abort command that kills a game and unload it
    }
    else if (client.game && !client.loadLocked) {
        client.unloadGame(message);
    }
    if (!client.available_games.has(args[0])) {
        message.reply(`Je ne connais pas le jeu "${args[0]}"`);
    }
    else {
        client.loadGame(args[0], message)
            .then(() => message.channel.send(`J'ouvre le jeu "${client.game.name}" !`));
    }
}
