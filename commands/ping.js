module.exports = {
    name: "ping",
    description: "demande au bot de vous répondre",
    usage: "[<message>]",
    minArgs: 0,
    help: "permet par exemple de vérifier qu\'il n\'a pas planté",
    execute(message, args, client) {
        if (!args.length) {
            return message.reply('pong');
        }
        return message.reply(`pong ${args.join(' ')}`)
    },
};
