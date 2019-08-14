import * as Hector from "../hector";
import * as Discord from "discord.js";

export class Command extends Hector.Command {
    // The command's informations
    str = "unload";
    description = "décharge le jeu en cours";
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
        if (!this.client.game) {
            return message.reply("aucun jeu n'est actuellement chargé");
        }

        this.client.unloadGame(message);
    }
}
