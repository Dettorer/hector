module.exports = {
    name: 'list_games',
    description: 'liste les jeux disponibles',
    usage: 'list_games',
    help: '',
    execute(message, args, client) {
        message.channel.send('Je connais les jeux suivants :')
        for (var game of client.available_games.array()) {
            message.channel.send(`${game.short_name} : ${game.name} - ${game.short_description}`)
        }
    },
};
