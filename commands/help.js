function listCommands(client, channel) {
    channel.send("Les commandes générales sont :")
    for (var command of client.commands.array()) {
        channel.send(`${client.config.prefix}${command.name} : ${command.description}`)
    }

    if (client.game) { // if a game is loaded, list its commands
        channel.send(`Les commandes du jeu en cours (${client.game.name}) sont :`)
        for (var command of client.game_commands.array()) {
            channel.send(`${client.config.prefix}${command.name} : ${command.description}`)
        }
    }
}

module.exports = {
    name: 'help',
    description: 'liste les commandes ou affiche leur aide et leur usage',
    usage: 'help <commande>',
    help: 'note : dans les usages, des crochets "[]" signifient qu\'un paramètre est optionel, des chevrons "<>" signifie qu\'il faut remplacer cette partie par quelque chose, sans garder les chevrons',
    execute(message, args, client) {
        // If no argument is given, give the list of available commands
        if (!args.length) {
            return listCommands(client, message.channel);
        }

        // If the requested command doesn't exist, inform the user unambiguously (we don't want them to think that the "help" command doesn't exist)
        if (!client.commands.has(args[0]) && !client.game_commands.has(args[0])) {
            return message.channel.send(`Je ne connais pas la commande "${client.config.prefix}${args[0]}", je ne peux donc pas afficher son aide.`)
        }

        // Get the correct command
        var command;
        if (client.commands.has(args[0])) {
            command = client.commands.get(args[0]);
        } else {
            command = client.game_commands.get(args[0]);
        }

        // If the requested command doesn't any bit of documentation, inform the user and encourage him to reprimand the devs.
        if (!command.usage && !command.help && !command.description) {
            return message.send(`La commande "${client.config.prefix}${args[0]}" existe mais n'a pas d'aide, vous pouvez aller insulter la personne qui l'a écrite.`)
        }

        // Print the command's usage, then its help.
        if (command.usage) {
            message.channel.send(`usage : ${client.config.prefix}${command.usage}`);
        }
        if (command.description) {
            message.channel.send(command.description)
        }
        if (command.help) {
            message.channel.send('.');
            message.channel.send(command.help);
        }
    },
};