module.exports = {
    name: "load",
    description: "charge le jeu demandé",
    usage: "<jeu>",
    minArgs: 1,
    help: "",
    execute(message, args, client) {
        if (client.game) {
            return message.reply(`Un jeu (${client.game.name}) est déjà chargé, il faut d'abord le quitter.`)
        }

        if (!client.available_games.has(args[0])) {
            message.reply(`Je ne connais pas le jeu "${args[0]}"`)
        } else {
            client.loadGame(args[0], message);
            client.game.play(client, message);
        }
    },
};
