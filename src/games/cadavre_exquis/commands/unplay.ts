import * as Hector from "../../../hector";
import * as Cadavre from "../game";
import * as Discord from "discord.js";

export class Command extends Hector.Command {
    // The command's informations
    str = "unplay";
    description = "ne plus être inclus dans les parties suivantes";
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
        // ensure the game object has been initialized
        let game = this.client.game as Cadavre.Game;
        if (!game) {
            return this.client.crash("cadavre: handleDM: this.client.game hasn't been initialized");
        }

        if (game.pendingPlayers.has(message.author.id)) {
            game.pendingPlayers.delete(message.author.id);
            return message.reply("Ok, à plus");
        }
    }
}
