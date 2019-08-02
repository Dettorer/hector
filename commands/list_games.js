module.exports = {
    name: "list_games",
    description: "liste les jeux disponibles",
    usage: "list_games",
    minArgs: 0,
    help: "",
    execute(message, args, client) {
        for (var game of client.available_games.array()) {
            client.bufferizeText(`\`${game.short_name}\` : **${game.name}** - ${game.short_description}`)
        }

        var embed = client.flushBufferToEmbed();
        embed.setTitle("Je connais les jeux suivants :");
        message.channel.send(embed);
    },
};
