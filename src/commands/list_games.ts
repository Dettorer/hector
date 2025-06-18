import * as Hector from "../hector";
import * as Discord from "discord.js";

export class Command extends Hector.Command {
    // The command's informations
    str = "list_games";
    description = "liste les jeux disponibles";
    usage = "";
    minArgs = 0;
    help = "";

    /**
     * Handle the command
     *
     * @param message - the user message that invoked the command
     * @param args - the arguments the user gave to the command
     */
    execute(message: Discord.Message, args: Array<string>) {
        if (!message.channel.isSendable())
            return

        for (var game of this.client.available_games.values()) {
            this.client.bufferizeText(`\`${game.short_name}\` : **${game.name}** - ${game.short_description}`);
        }
        var embed = this.client.flushBufferToEmbed();
        embed.setTitle("Je connais les jeux suivants :");
        message.channel.send({ embeds: [embed] });
    }
}
