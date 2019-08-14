# Hector
A [discord.js](https://discord.js.org) bot that implements little board
games (only speaks french as of today)

Its name comes from the second gym leader from Pokémon gold/silver:
[Bugsy](https://bulbapedia.bulbagarden.net/wiki/Bugsy) (whose french name is
Hector). Bugsy is a gym leader, perfect for a bot that is a game master, and
he specializes in Bug-type Pokémon, making him full of bug, perfect for a bot
made by someone whose using that project to learn javascript and typescript (and
that would be me).

# Usage
This bot needs the [discord.js](https://discord.js.org) library and few more
dependencies you need to install with:

```
$ npm install
```

To configure the bot, copy `config.json.example` to `config.json` and replace
all placeholders (values surrounded by chevrons `<>`) by actual relevant values
for your context (please remove the chevrons when you do so).

You can then launch the bot by using the `start` script of the npm package, for
example in a terminal on Linux:

```
$ npm start
```

# Available games
## Cadavre exquis

In this game, players create a sentence by each writing one part of it, without
knowing what the others in theirs. The bot coordinates the players by querying
each one of them which part should they write and with what agreements they
should use. The result is usually a hilariously nonsensical sentence with
correct grammar (especially if players are creative).

This implementation of the game is heavily inspired by
[Zopieux](https://github.com/Zopieux)'s one for IRC:
[cadavre-exquis](https://github.com/Zopieux/cadavre-exquis/).

# Development
## Add a command

To add a command, create a `.ts` file of your choice in the `commands` folder of
the project's folder (for general purpose commands available at any time) or in
the `commands` folder of a game (for commands specific to that game).

This file must export a class named `Command` that extends the abstract class `Hector.Command` defined in `hector.ts`.

A typical command file looks like this:

```typescript
import * as Hector from "../hector";
import * as Discord from "discord.js";

export class Command extends Hector.Command {
    // The command's informations
    str = "<name of the command>"; // it's what users will type after the command prefix to invoke your command
    description = "<short description>"; // will be displayed when listing commands
    usage = "<usage>"; // will be displayed by the `help` command
    minArgs = <count>; // number of mandatory arguments for this command
    help = "<optional notes, remarks or further help>"; // will be displayed by the `help` command

    /**
     * Handle the command
     *
     * @param message - the user message that invoked the command
     * @param args - the arguments the user gave to the command
     */
    execute(message: Discord.Message, args: Array<string>) {
        // Your code to handle the command
        // You can acces the bot object with `this.client`
    }
}
```

Given to the `execute` function are:

- `message`, the [`Discord.Message`](https://discord.js.org/#/docs/main/stable/class/Message) that invoked the command;
- `args`, a `Array<String>` containing the arguments the user gave;

For game commands, if you want to have more attributes and functions than those
specified in `Hector.Game`, you'll need to have access to the real game type,
this can be done with one `import` and the `as` operator. A typical game command
file looks like this:

```typescript
import * as Hector from "../hector";
import * as Cadavre from "../game";
import * as Discord from "discord.js";

export class Command extends Hector.Command {
    // The command's informations
    str = "<name of the command>"; // it's what users will type after the command prefix to invoke your command
    description = "<short description>"; // will be displayed when listing commands
    usage = "<usage>"; // will be displayed by the `help` command
    minArgs = <count>; // number of mandatory arguments for this command
    help = "<optional notes, remarks or further help>"; // will be displayed by the `help` command

    /**
     * Handle the command
     *
     * @param message - the user message that invoked the command
     * @param args - the arguments the user gave to the command
     */
    execute(message: Discord.Message, args: Array<string>) {
        // ensure the game object has been initialized
        let game = this.client.game as Cadavre.Game;
        if (!game) {
            return this.client.crash("<game name>: <command name>: this.client.game hasn't been initialized");
        }

        // Your code to handle the command
        // You can acces the bot object with `this.client`
    }
}
```

## Add a game

To add a game, you need to create a folder in the `games` folder containing at
least the following:

- a `commands` folder in which you'll add commands as described above;
- a `game.ts` file.

The `game.ts` file must export a class named `Game` that extends the abstract class `Hector.Game` defined in `hector.ts`.

A typical game file looks like this:

```typescript
import * as Hector from "../../hector";
import * as Discord from "discord.js";

export class Game extends Hector.Game {
    short_name = '<name>'; // used to identify the game both internally and by users to launch a game
    name = '<full name>'; // more elaborate name used when listing games or speaking about it
    short_description = '<description>'; // used when listing games
    path = '<path>'; // path to the game folder (where `game.ts` file and `commands` folder are)

    /**
     * Handle a private message from a user.
     *
     * @param message - the private message
     */
    handleDM(message: Discord.Message) {
    }

    /**
     * Initialize needed data for the game
     *
     * @param client - the bot object
     * @param message - the message that made the bot start that game, if available
     */
    load(client: Hector.Client, message: Discord.Message) {
    }

    /**
     * End the current game and clean up our data. This can be called because the game ended or because we want to abort it (so it can happen anytime).
     *
     * @param message - the message that made the bot start that game, if available
     */
    unload(message: Discord.Message | null = null) {
    }

    // At any point, you can acces the bot object with `this.client`
```

If at any point, your game is in a state that makes it unsafe to unload, please
update the client's `loadLocked` boolean to `true`, it will prevent users to
unload your game inavertedly when trying to load another one. Keep in mind
though that they still can kill your game, but they have to do it explicitly.
