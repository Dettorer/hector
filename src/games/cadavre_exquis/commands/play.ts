import * as Hector from "../../../hector";
import * as Discord from "discord.js";

export class Command extends Hector.Command {
    // The command's informations
    str = "play";
    description = "rejoint les prochaînes parties";
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
        let game = this.client.game;
        if (!game) {
            return this.client.crash("cadavre: loading the game but this.client.game hasn't been initialized");
        }

        if (!game.pendingPlayers.has(message.author.id)) {
            game.pendingPlayers.add(message.author.id);
            return message.reply("Ok, je note pour la prochaîne partie");
        } else {
            return message.reply("C'est déjà noté");
        }
    }
}
