import Hector from "../../../hector.js";
import Discord from "discord.js";

// The command's informations
export const name = "playing";
export const description = "liste les gens qui veulent jouer";
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
    if (client.game.pendingPlayers.size === 0) {
        return message.channel.send("Personne ne joue.");
    }
    client.bufferizeLine(`Il y a ${client.game.pendingPlayers.size} personnes prêtes à jouer:`);
    for (let id of client.game.pendingPlayers) {
        client.bufferizeText(`${message.channel.members.get(id).displayName} `);
    }
    client.bufferizeLine("");
    return message.channel.send(client.flushBufferToString());
}
