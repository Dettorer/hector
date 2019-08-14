import * as Hector from "hector";
import * as Discord from "discord.js";

// The command's informations
export const name = "kick";
export const description = "effectue la commande `unplay` à la place de quelqu'un d'autre";
export const usage = "<personne>";
export const minArgs = 1;
export const help = "";

/**
 * Handle the command
 * TODO: only mods should be able to invoke this command
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

    // Ensure we are in a text channel, so we can use its member list
    const channel = message.channel;
    if (!(channel instanceof Discord.TextChannel)) {
        console.warn("cadavre's kick command was called inside a DM, ignoring and warning the user");
        return message.reply("Cette commande doit être utilisée dans le salon de jeu, pas en privé");
    }

    const user = channel.members.find(user => user.displayName === args[0]);
    if (!user) {
        return message.reply(`je ne sais pas qui est ${args[0]}.`);
    }
    if (!game.pendingPlayers.has(user.id)) {
        return message.reply(`${args[0]} n'a pas dit vouloir jouer.`);
    }
    game.pendingPlayers.delete(user.id);
    return message.reply(`Ok, je vire ${args[0]}.`);
}
