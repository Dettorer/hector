module.exports = {
    name: 'ping',
    description: 'Ping!',
    usage: 'ping <message>',
    help: 'demande au bot de vous répondre (permet par exemple de vérifier qu\'il n\'a pas planté)',
    execute(message, args, client) {
        if (!args.length) {
            return message.reply('pong');
        }
        return message.reply(`pong ${args.join(' ')}`)
    },
};
