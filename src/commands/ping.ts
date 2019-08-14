import * as Hector from "../hector";
import * as Discord from "discord.js";

export class Command extends Hector.Command {
    // The command's informations
    str = "ping";
    description = "demande au bot de vous répondre";
    usage = "[<message>]";
    minArgs = 0;
    help = "permet par exemple de vérifier qu\'il n\'a pas planté";

    /**
     * Handle the command
     *
     * @param message - the user message that invoked the command
     * @param args - the arguments the user gave to the command
     */
    execute(message: Discord.Message, args: Array<string>) {
        if (!args.length) {
            return message.reply('pong');
        }
        return message.reply(`pong ${args.join(' ')}`);
    }
}
