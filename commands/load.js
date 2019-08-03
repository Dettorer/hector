module.exports = {
    name: "load",
    description: "charge le jeu demandé",
    usage: "<jeu>",
    minArgs: 1,
    help: "",
    execute(message, args, client) {
        if (client.game && client.loadLocked) {
            return message.reply(`Un jeu (${client.game.name}) est en cours, il faut d'abord le quitter.`) // TODO: make an abort command that kills a game and unload it
        } else if (client.game && !client.loadLocked) {
            client.unloadGame(message);
        }

        if (!client.available_games.has(args[0])) {
            message.reply(`Je ne connais pas le jeu "${args[0]}"`)
        } else {
            client.loadGame(args[0], message);
        }
    },
};
