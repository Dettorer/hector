import * as Hector from "../hector";
import * as Discord from "discord.js";

export class Command extends Hector.Command {
    // The command's informations
    str = "load";
    description = "charge le jeu demandé";
    usage = "<jeu>";
    minArgs = 1;
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

        if (this.client.game && this.client.loadLocked) {
            return message.reply(`Un jeu (${this.client.game.name}) est en cours, il faut d'abord le quitter.`); // TODO: make an abort command that kills a game and unload it
        }
        else if (this.client.game && !this.client.loadLocked) {
            this.client.unloadGame(message);
        }
        else {
            this.client.loadGame(args[0], message)
            .then((game: Hector.Game) => {
                if (message.channel.isSendable())
                    message.channel.send(`J'ouvre le jeu \`${game.name}\` !`)
            })
            .catch((error: Error) => message.reply(error.message));
        }
    }
}
