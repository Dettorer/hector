import * as Hector from "../hector";
import * as Discord from "discord.js";

export class Command extends Hector.Command {
    // The command's informations
    str = "say";
    description = "fait dire quelque chose au bot";
    usage = "<message>";
    minArgs = 1;
    help = "";

    /**
     * Handle the command
     *
     * @param message - the user message that invoked the command
     * @param args - the arguments the user gave to the command
     */
    execute(message: Discord.Message, args: Array<string>) {
        if (message.channel.isSendable())
            return message.channel.send(args.join(' '));
    }
}
