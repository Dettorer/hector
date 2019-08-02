module.exports = {
    name: 'ping',
    description: 'demande au bot de vous répondre (en répétant ce que vous avez éventuellement dit)',
    usage: 'ping [<message>]',
    help: 'permet par exemple de vérifier qu\'il n\'a pas planté',
    execute(message, args, client) {
        if (!args.length) {
            return message.reply('pong');
        }
        return message.reply(`pong ${args.join(' ')}`)
    },
};
