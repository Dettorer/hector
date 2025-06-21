import { RemindersFile } from "./remind";
import * as Hector from "../hector";
import * as Discord from "discord.js";

export class Command extends Hector.Command {
    // The command's informations
    str = "unremind";
    description = "annule un rappel enregistré via la commande `remind`";
    usage = "<id>";
    minArgs = 1;
    help = "L'id est trouvable via la commande `listreminders` (et est donné au moment de l'enregistrement par la commande `remind`)";

    /**
     * Handle the command
     *
     * @param message - the user message that invoked the command
     * @param args - the arguments the user gave to the command
     */
    async execute(message: Discord.Message, args: Array<string>) {
        const channel = this.client.channel;
        if (channel === null)
            throw "the bot's configured channel is null";
        if (message.channel != this.client.channel) {
            return channel.send(
                `Désolé, je n'accepte cette commande que sur mon salon principal : ${channel}`
            );
        }

        const id = +args[0];
        const deleted_reminder = await RemindersFile.removeReminder(+args[0])
        if (deleted_reminder === null) {
            return channel.send(`Aucun rappel n'existe avec l'identifiant ${id}`);
        } else {
            const str_deleted_reminder = JSON.stringify(deleted_reminder);
            return channel.send(`J'ai bien annulé le rappel suivant : ${str_deleted_reminder}`);
        }
    }
};
