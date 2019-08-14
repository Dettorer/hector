import * as Hector from "../../../hector";
import * as Cadavre from "../game";
import * as Discord from "discord.js";

export class Command extends Hector.Command {
    // The command's informations
    str = "playing";
    description = "liste les gens qui veulent jouer";
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

        // Ensure we are in a text channel, so we can use its member list
        const channel = message.channel;
        if (!(channel instanceof Discord.TextChannel)) {
            console.warn("cadavre's kick command was called inside a DM, ignoring and warning the user");
            return message.reply("Cette commande doit être utilisée dans le salon de jeu, pas en privé");
        }

        if (game.pendingPlayers.size === 0) {
            return message.channel.send("Personne ne joue.");
        }

        this.client.bufferizeLine(`Il y a ${game.pendingPlayers.size} personnes prêtes à jouer:`);
        for (let id of game.pendingPlayers) {
            const member = channel.members.get(id);
            if (!member) {
                const errorMsg = `cadavre: Member id "${id}" is in pendingPlayers but the corresponding channel member cannot be found`;
                return this.client.crash(errorMsg, channel);
            }
            this.client.bufferizeText(`${member.displayName} `);
        }
        this.client.bufferizeLine("");
        return message.channel.send(this.client.flushBufferToString());
    }
}
