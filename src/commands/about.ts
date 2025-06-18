import * as Hector from "../hector";
import * as Discord from "discord.js";

export class Command extends Hector.Command {
    // The command's informations
    str = "about";
    description = "affiche des informations génériques sur le bot";
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
        this.client.bufferizeLine("Hector est un bot discord développé par Paul \"Dettorer\" Hervot sous license AGPLv3.");
        this.client.bufferizeLine("Source, informations et signalement de bugs sur github : https://github.com/Dettorer/hector");

        if (message.channel.isSendable())
            return message.channel.send(this.client.flushBufferToString());
    }
}
