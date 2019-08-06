import Hector from "../hector.js";
import Discord from "discord.js";

// The command's informations
export const name = "help";
export const description = "liste les commandes ou affiche leur aide et leur usage";
export const usage = "[<commande>]";
export const minArgs = 0;
export const help = "note : dans les usages, des crochets \"[]\" signifient qu'un paramètre est optionel, des chevrons \"<>\" signifie qu'il faut remplacer cette partie par quelque chose, sans garder les chevrons";

/**
 * Write a list of available commands on the given channel
 *
 * @param {Hector} client
 * @param {Discord.TextChannel} channel
 */
function listCommands(client, channel) {
    // Bufferize general commands
    for (var command of client.commands.array()) {
        client.bufferizeLine(`\`${client.config.prefix}${command.name}\` : ${command.description}`)
    }

    // Send them in an embed
    var embed = client.flushBufferToEmbed();
    embed.setTitle("Les commandes générales sont :");
    channel.send(embed);

    if (client.game) { // if a game is loaded, list its commands
        // Bufferize the current game commands
        for (var command of client.game_commands.array()) {
            client.bufferizeLine(`\`${client.config.prefix}${command.name}\` : ${command.description}`)
        }

        // Send them in an embed
        embed = client.flushBufferToEmbed();
        embed.setTitle(`Les commandes du jeu en cours (${client.game.name}) sont :`)
        channel.send(embed);
    }
}

/**
* Handle the command
*
* @param {Hector} client - the bot object
* @param {Discord.Message} message - the user message that invoked the command
* @param {Array<String>} args - the arguments the user gave to the command
*/
export function execute(message, args, client) {
    // If no argument is given, give the list of available commands
    if (!args.length) {
        return listCommands(client, message.channel);
    }
    // If the requested command doesn't exist, inform the user unambiguously (we don't want them to think that the "help" command doesn't exist)
    if (!client.commands.has(args[0]) && !client.game_commands.has(args[0])) {
        return message.channel.send(`Je ne connais pas la commande \`${client.config.prefix}${args[0]}\`, je ne peux donc pas afficher son aide.`);
    }
    // Get the correct command
    var command;
    if (client.commands.has(args[0])) {
        command = client.commands.get(args[0]);
    }
    else {
        command = client.game_commands.get(args[0]);
    }
    // If the requested command doesn't any bit of documentation, inform the user and encourage him to reprimand the devs.
    if (!command.usage && !command.help && !command.description) {
        return message.send(`La commande \`${client.config.prefix}${args[0]}\` existe mais n'a pas d'aide, vous pouvez aller insulter la personne qui l'a écrite.`);
    }
    // Print the command's usage, then its short description and its help.
    client.bufferizeLine(`**usage :** \`${client.getCommandUsage(command)}\``);
    client.bufferizeLine(command.description);
    if (command.help != "") {
        client.bufferizeLine("");
        client.bufferizeLine(command.help);
    }
    var embed = client.flushBufferToEmbed();
    embed.setTitle(`Commande \`${client.config.prefix}${command.name}\``);
    return message.channel.send(embed);
}
