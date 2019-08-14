import * as Hector from "../../../hector";
import * as Discord from "discord.js";

export class Command extends Hector.Command {
    // The command's informations
    str = "start";
    description = "démarre la partie";
    usage = "";
    minArgs = 0;
    help = "";

    /**
     * Handle the command
     *
     * @param client - the bot object
     * @param message - the user message that invoked the command
     * @param args - the arguments the user gave to the command
     */
    execute(message: Discord.Message, args: Array<string>) {
        // ensure the game object has been initialized
        let game = this.client.game;
        if (!game) {
            return this.client.crash("cadavre: handleDM: this.client.game hasn't been initialized");
        }

        if (game.playing) {
            return message.reply(`Une partie est déjà en cours, si vous voulez rejoindre les suivantes, faites \`${this.client.config.prefix}play\`.`);
        }
        if (!game.pendingPlayers.has(message.author.id)) {
            return message.reply(`Vous n'avez pas rejoins la partie, vous ne pouvez pas la lancer. Pour rejoindre les parties suivantes, faites \`${this.client.config.prefix}play\`.`);
        }
        if (game.pendingPlayers.size < 3) {
            return message.reply("Désolé, il faut au moins trois personnes pour jouer.");
        }

        game.start(this.client, message);
    }
}
