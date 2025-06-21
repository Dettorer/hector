import { RemindersFile } from "./remind";
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

        this.client.bufferizeLine(`Il y a actuellement ${reminders.length} rappels à venir :`)
        for (const rem of reminders) {
            const str_rem = JSON.stringify(rem);
            this.client.bufferizeLine(`- ${str_rem}`); 
        }
        channel.send(this.client.flushBufferToString());
    }
};
