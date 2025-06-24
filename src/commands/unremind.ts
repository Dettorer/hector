import { RemindersFile, formatReminderData } from "./remind";
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
        } else if (!RemindersFile.SAVEID_TO_TIMEOUT.has(id)) {
            return channel.send(
                `Erreur interne, merci de prévenir mon créateur, vous pouvez même vous moquer un peu de `
                + `lui au passage, il m'a manifestement mal codé.\n\n`
                + `Détails techniques : j'ai bien un rappel dont l'ID est ${id} dans mon \`RemindersFile\` et je `
                + `l'ai bien supprimé, mais aucun \`Timeout\` n'est associé à cet ID dans la table `
                + `\`RemindersFile.SAVEID_TO_TIMEOUT\`, je ne peux donc pas annuler le \`Timeout\` en cours, le `
                + `rappel sera quand même envoyé à la date initialement prévue, **ce qui va probablement supprimer `
                + `un autre rappel au hasard au passage**. Pour régler temporairement la situation, il devrait `
                + `suffire de redémarrer le bot (vu que le rappel n'est plus dans mon \`RemindersFile\`, je ne le `
                + `relancerai pas au démarrage).`
            )
        } else {
            clearTimeout(RemindersFile.SAVEID_TO_TIMEOUT.get(id));
            const str_deleted_reminder = formatReminderData(deleted_reminder, this.client.dateFormater);
            return channel.send(`Ok, j'ai bien annulé le ${str_deleted_reminder}`);
        }
    }
};
