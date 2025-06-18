import * as Hector from "../hector";
import * as Discord from "discord.js";

export class Command extends Hector.Command {
    // The command's informations
    str = "help";
    description = "liste les commandes ou affiche leur aide et leur usage";
    usage = "[<commande>]";
    minArgs = 0;
    help = "note : dans les usages, des crochets \"[]\" signifient qu'un paramètre est optionel, des chevrons \"<>\" signifie qu'il faut remplacer cette partie par quelque chose, sans garder les chevrons";

    /**
     * Write a list of available commands on the given channel
     *
     * @param channel - the channel in which to list commands
     */
    listCommands(channel: Discord.SendableChannels) {
        // Bufferize general commands
        for (var command of this.client.commands.values()) {
            this.client.bufferizeLine(`\`${this.client.config.prefix}${command.str}\` : ${command.description}`)
        }

        // Send them in an embed
        var embed = this.client.flushBufferToEmbed();
        embed.setTitle("Les commandes générales sont :");
        channel.send({ embeds: [embed] });

        if (this.client.game) { // if a game is loaded, list its commands
            // Bufferize the current game commands
            for (var command of this.client.game_commands.values()) {
                this.client.bufferizeLine(`\`${this.client.config.prefix}${command.str}\` : ${command.description}`)
            }

            // Send them in an embed
            embed = this.client.flushBufferToEmbed();
            embed.setTitle(`Les commandes du jeu en cours (${this.client.game.name}) sont :`)
            channel.send({ embeds: [embed] });
        }
    }

    /**
     * Handle the command
     *
     * @param message - the user message that invoked the command
     * @param args - the arguments the user gave to the command
     */
    execute(message: Discord.Message, args: Array<string>) {
        // If no argument is given, give the list of available commands
        if (!message.channel.isSendable())
            return

        if (!args.length) {
            return this.listCommands(message.channel);
        }

        // Get the correct command
        let command = this.client.commands.get(args[0]);
        if (!command) { // it's not a general purpose command, it may be a command defined by the current loaded game
            command = this.client.game_commands.get(args[0]);
        }
        if (!command) { // If the requested command doesn't exist, inform the user unambiguously (we don't want them to think that the "help" command doesn't exist)
            return message.channel.send(`Je ne connais pas la commande \`${this.client.config.prefix}${args[0]}\`, je ne peux donc pas afficher son aide.`);
        }

        // If the requested command doesn't have any bit of documentation, inform the user and encourage them to reprimand the devs.
        if (!command.usage && !command.help && !command.description) {
            return message.channel.send(`La commande \`${this.client.config.prefix}${args[0]}\` existe mais n'a aucune aide, vous pouvez aller insulter la personne qui l'a écrite.`);
        }

        // Print the command's usage, then its short description and its help.
        this.client.bufferizeLine(`**usage :** \`${this.client.getCommandUsage(command)}\``);
        this.client.bufferizeLine(command.description);
        if (command.help != "") {
            this.client.bufferizeLine("");
            this.client.bufferizeLine(command.help);
        }

        var embed = this.client.flushBufferToEmbed();
        embed.setTitle(`Commande \`${this.client.config.prefix}${command.str}\``);
        return message.channel.send({ embeds: [embed] });
    }
}
