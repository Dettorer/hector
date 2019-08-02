module.exports = {
    name: "abort",
    description: "annule et termine la partie en cours",
    usage: "",
    minArgs: 0,
    help: "",
    execute(message, args, client) {
        if (!client.game) {
            return message.reply("il n'y a aucun jeu à terminer")
        }

        client.unloadGame(message);
    },
};
