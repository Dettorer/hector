module.exports = {
    name: "unload",
    description: "décharge le jeu en cours",
    usage: "",
    minArgs: 0,
    help: "",
    execute(message, args, client) {
        if (!client.game) {
            return message.reply("aucun jeu n'est actuellement chargé")
        }

        client.unloadGame(message);
    },
};
