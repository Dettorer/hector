module.exports = {
    name: 'help',
    description: 'command manual',
    usage: 'help <commande>',
    help: 'affiche un message à carractère informatif sur la commande, ainsi que la façon dont on l\'utilise.',
    execute(message, args, client) {
        // If no argument is given, give the list of available commands
        if (!args.length) {
            message.channel.send("Voici la liste des commandes disponibles :")
            for (var i = 0; i < client.commands.size; i++) {
                message.channel.send(`${client.config.prefix}${client.commands.array()[i].name}`)
            }
            return;
        }

        // If the requested command doesn't exist, inform the user unambiguously (we don't want them to think that the "help" command doesn't exist)
        if (!client.commands.has(args[0])) {
            return message.channel.send(`Je ne connais pas la commande "${client.config.prefix}${args[0]}", je ne peux donc pas afficher son aide.`)
        }

        // If the requested command doesn't any bit of documentation, inform the user and encourage him to reprimand the devs.
        const command = client.commands.get(args[0]);
        if (!command.usage && !command.help) {
            return message.send(`La commande "${client.config.prefix}${args[0]}" existe mais n'a pas d'aide, vous pouvez aller insulter la personne qui l'a écrite.`)
        }

        // Print the command's usage, then its help.
        if (command.usage) {
            message.channel.send(`${client.config.prefix}${command.usage}`);
        }
        if (command.help) {
            message.channel.send(command.help);
        }
    },
};