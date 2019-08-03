# Hector
A [discord.js](https://discord.js.org) bot that (will) implement little board
games (only speaks french as of today)

Its name comes from the second gym leader from Pokémon gold/silver:
[Bugsy](https://bulbapedia.bulbagarden.net/wiki/Bugsy) (whose french name is
Hector). Bugsy is a gym leader, perfect for a bot that is a game master, and
he specializes in Bug-type Pokémon, making him full of bug, perfect for a bot
made by someone whose using that project to learn javascript (and that would be
me).

# Usage
This bot needs the [discord.js](https://discord.js.org) library:

```
$ npm install discord.js
```

To configure the bot, copy `config.json.example` to `config.json` and replace
all placeholders (values surrounded by chevrons `<>`) by actual relevant values
for your context (please remove the chevrons when you do so).

You can then launch the `hector.js` file with nodejs, for example in a terminal on Linux:

```
$ node hector.js
```

# Development
## Add a command

To add a command, create a `.js` file of your choice in the `commands` folder of
the project's folder (for general purpose commands available at any time) or in
the `commands` folder of a game (for commands specific to that game).

This file must export some symbols as described in the following template:

```javascript
const Hector = require("hector.js");
const Discord = require("discord.js");

module.exports = {
    name: '<name of the command>', // it's what users will type after the command prefix to invoke your command
    description: '<short description>', // will be displayed when listing commands
    usage: '<usage>', // will be displayed by the `help` command
    minArgs: <count>, // number of mandatory arguments for this command
    help: '<optional notes, remarks or further help>', // will be displayed by the `help` command

    /**
     * Handle the command
     *
     * @param {Hector.Client} client - the bot object
     * @param {Discord.Message} message - the user message that invoked the command
     * @param {Array<String>} args - the arguments the user gave to the command
     */
    execute(message, args, client) {
        // Your code to handle the command
    },
};
```

Given to the `execute` function are:

- `message`, the [`Discord.Message`](https://discord.js.org/#/docs/main/stable/class/Message) that invoked the command;
- `args`, a `Array<String>` containing the arguments the user gave;
- `client`, a `Hector.Client` object, extending [`Discord.Client`](https://discord.js.org/#/docs/main/stable/class/Client), see discord.js' documentation and `hector.js` file for available methods.

## Add a game

To add a game, you need to create a folder in the `games` folder containing at
least the following:

- a `commands` folder in which you'll add commands as described above;
- a `game.js` file.

The `game.js` file must export the following symbols:

```javascript
module.exports = {
    short_name: '<name>', // used to identify the game both internally and by users to launch a game
    name: '<full name>', // more elaborate name used when listing games or speaking about it
    short_description: '<description>', // used when listing games
    path: '<path>', // path to the game folder (where `game.js` file and `commands` folder are)
    load: load, // a function that will be invoked when loading the game to let you prepare any stuff you need before it starts
    unload: unload, // a function that will be invoked when stopping the game to let you clean up any stuff you may have added do `client`
};
```

Furthermore, every game should implement a `start` command, that launches a
match. It can be assumed that its `load` function has been called before.

If at any point, your game is in a state that makes it unsafe to unload, please
update the client's `loadLocked` boolean to `true`, it will prevent users to
unload your game inavertedly when trying to load another one. Keep in mind
though that they still can kill your game, but they have to do it explicitly.
