module.exports = {
    name: "play",
    description: "lance une partie du jeu demandé",
    usage: "<jeu>",
    minArgs: 1,
    help: "",
    execute(message, args, client) {
        if (client.game) {
            return message.reply(`Une partie de ${client.game.name} est déjà en cours, je ne peux pas lancer autre chose.`)
        }

        if (!client.available_games.has(args[0])) {
            message.reply(`Je ne connais pas le jeux "${args[0]}"`)
        } else {
            client.loadGame(args[0], message);
            client.game.play(client, message);
        }
    },
};
