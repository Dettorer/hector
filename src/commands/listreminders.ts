import { RemindersFile, formatReminderData } from "./remind";
import * as Hector from "../hector";
import * as Discord from "discord.js";

export class Command extends Hector.Command {
    // The command's informations
    str = "listreminders";
    description = "liste tous les rappels enregistré via la commande `remind` qui ne sont pas encore arrivés";
    usage = "";
    minArgs = 0;
    help = "";

    /**
     * Handle the command
     *
     * @param message - the user message that invoked the command
     * @param args - the arguments the user gave to the command
     */
    async execute(message: Discord.Message, _args: Array<string>) {
        const channel = this.client.channel;
        if (channel === null)
            throw "the bot's configured channel is null";
        if (message.channel != this.client.channel) {
            return channel.send(
                `Désolé, je n'accepte cette commande que sur mon salon principal : ${channel}`
            );
        }

        const reminders = await RemindersFile.loadFile();
        if (reminders.length === 0) {
            return channel.send("Aucun rappel n'est actuellement enregistré");
        }

        const reminder_count = `${reminders.length} rappel` + (reminders.length > 1 ? "s" : "");
        this.client.bufferizeLine(`Il y a actuellement ${reminder_count} à venir :`)
        for (const rem of reminders) {
            this.client.bufferizeLine(`- ${formatReminderData(rem, this.client.dateFormater)}`); 
        }
        channel.send(this.client.flushBufferToString());
    }
};
