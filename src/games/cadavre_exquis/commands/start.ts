import * as Hector from "hector";
import * as Discord from "discord.js";

// The command's informations
export const name = "start";
export const description = "démarre la partie";
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

    if (game.playing) {
        return message.reply(`Une partie est déjà en cours, si vous voulez rejoindre les suivantes, faites \`${client.config.prefix}play\`.`);
    }
    if (!game.pendingPlayers.has(message.author.id)) {
        return message.reply(`Vous n'avez pas rejoins la partie, vous ne pouvez pas la lancer. Pour rejoindre les parties suivantes, faites \`${client.config.prefix}play\`.`);
    }
    if (game.pendingPlayers.size < 3) {
        return message.reply("Désolé, il faut au moins trois personnes pour jouer.");
    }

    game.start(client, message);
}
