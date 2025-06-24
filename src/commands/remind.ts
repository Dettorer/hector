import fs from "fs";
import { setTimeout } from "timers";
import {isError} from "lodash";
import * as Hector from "../hector";
import * as Discord from "discord.js";

export interface ReminderSerializeData {
    id: number,
    date: string;
    username: string;
    message: string;
};

export function formatReminderData(data: ReminderSerializeData, dateFormater: Intl.DateTimeFormat): string {
    const date_str = dateFormater.format(new Date(data.date));
    return `rappel n°${data.id} pour ${data.username}, le ${date_str}: "${data.message}"`;
}

function capDelayForSetTimeout(delay: number): number {
    // XXX: see the other "XXX" comments in the `Command.remind` and `Command.launchReminder`.
    const limit = Math.pow(2, 31) - 1;
    return Math.min(limit, delay);}

function remind(user: Discord.User | String, message: String, date: Date, saveFileId: number, channel: Discord.SendableChannels) {
    /* XXX: `remind` may have been called earlier than the requested date.
    * This is because `setTimeout` internally uses a 32b integer to
    * represent the delay, which means it cannot exceed roughly 24 days. We
    * need to decide whether send the reminder to the channel or wait longer
    * by calling `setTimeout` again
    */
    const remainding_delay_ms = date.getTime() - Date.now();
    if (remainding_delay_ms < 2000) {
        // we're less than 2s from the intended date, send the reminder
        channel.send(`${user} : ${message}`);
        RemindersFile.removeReminder(saveFileId);
    } else {
        // we were probably woken up too early, go back to sleep
        console.log(`rappel n°${saveFileId}, il reste ${remainding_delay_ms}ms, je me recouche`);
        const new_timeout = setTimeout(
            remind, 
            capDelayForSetTimeout(remainding_delay_ms),
            user,
            message,
            date,
            saveFileId,
            channel
        );
        // the timeout id just changed for this reminder, set it to the
        // RemindersFile's class translation table
        RemindersFile.SAVEID_TO_TIMEOUT.set(saveFileId, new_timeout);
    }
}

/**
 * Functions to handle the global file that saves the currently running reminders.
 *
 * This allows the bot to remember which reminders it should do even after a restart.
 */
export class RemindersFile {
    static FILENAME = "reminders.json";

    static SAVEID_TO_TIMEOUT: Map<number, NodeJS.Timeout> = new Map();

    /**
     * Write the given reminder data to the save file.
     */
    private static async saveToFile(data: ReminderSerializeData[]): Promise<void> {
        fs.writeFileSync(this.FILENAME, JSON.stringify(data));
    }

    /**
     * Reads the save file to retrieve a list of reminders
     */
    static async loadFile() : Promise<ReminderSerializeData[]> {
        if (!fs.existsSync(this.FILENAME))
            return [];

        const content = fs.readFileSync(this.FILENAME, 'utf8');
        return JSON.parse(content);
    }

    /**
     * Completely delete the save file, useful when used after loading the file when the bot is starting up
     * (and needs to decide which reminders to keep and which are outdated)
     */
    static async reset() {
        if (fs.existsSync(this.FILENAME)) {
            fs.unlinkSync(this.FILENAME);
        }
    }

    private static allocateNewId(existing_reminders: ReminderSerializeData[]): number {
        if (existing_reminders.length === 0) {
            return 1;
        }

        const max_id = Math.max(...existing_reminders.map(rem => rem.id));
        return max_id + 1;
    }

    static async addReminder(date: Date, username: string, message: string, id: number | null = null): Promise<number> {
        var reminders = await this.loadFile();
        if (id === null) {
            id = this.allocateNewId(reminders);
        }
        reminders.push({id: id, date: date.toISOString(), username: username, message: message});
        this.saveToFile(reminders);
        return id;
    }

    static async removeReminder(id: number): Promise<ReminderSerializeData | null> {
        const reminders = await this.loadFile();
        const position_to_delete = reminders.findIndex(rem => rem.id === id);
        if (position_to_delete === -1) {
            return null;
        }

        const deleted_reminder = reminders.splice(position_to_delete, 1)[0];
        console.log(deleted_reminder);
        this.saveToFile(reminders);
        return deleted_reminder;
    }
};

export class Command extends Hector.Command {
    // The command's informations
    str = "remind";
    description = "envoi un rappel à la date donnée";
    usage = "{everyone|<username>} <date> <heure> <message>";
    minArgs = 4;
    help = "La date doit être au format JJ-MM ou JJ-MM-AAAA, l'heure au format hh:mm ou hh:mm:ss";

    parseDateTimeArg(date: string, time: string): Date {
        const now = new Date(Date.now());
        const date_fragments = date.split("-");
        let [day, month, year] = [date_fragments[0], date_fragments[1], now.getFullYear()];
        if (date_fragments.length === 3) // the user's command provided a year
            year = +date_fragments[2];
        return new Date(`${year}-${month}-${day}T${time}`);
    }

    async init() {
        const reminders: ReminderSerializeData[] = await RemindersFile.loadFile();
        await RemindersFile.reset();
        for (const rem of reminders) {
            const strrem = JSON.stringify(rem);

            const date: Date = new Date(rem.date);
            if (date.getTime() < Date.now()) {
                console.log(`skiping the following reminder because it's in the past: ${strrem}`);
                continue;
            }

            var user = await this.getUser(rem.username);
            if (isError(user)) {
                console.log(user.message);
                return;
            }
            if (!(user instanceof Discord.User)) {
                user = `@${user}`;
            }

            const saveFileId = await RemindersFile.addReminder(date, rem.username, rem.message, rem.id);
            this.launchReminder(date, user, rem.message, saveFileId);

            console.log(`re-launched reminder: ${JSON.stringify(rem)}`);
        }
    }

    /**
     * Tries to find a user in the current guild that matches `username`
     */
    async getUser(username: string): Promise<Error | string | Discord.User> {
        if (username === "everyone")
            return username;

        const guild = this.client.guilds.cache.get(this.client.config.guild);
        var matching = await guild?.members.fetch({ query: username, limit: 1 });
        if (matching === undefined || matching.size == 0)
            return Error(`Je ne trouve personne du nom de ${username}`);
        else if (matching.size > 1)
            return Error(
                `"${username}" est ambigu, je trouve plusieurs personne pouvant`
                + ` correspondre : ${matching?.values()}`
            );
        else {
            const user = matching.first()?.user;
            if (user === undefined)
                return Error(`Je ne trouve personne du nom de ${username}`);
            else
                return user;
        }
    }

    /**
     * Euclidian division, returns division and remainder
     */
    eucl(a: number, b: number): [number, number] {
        return [Math.floor(a / b), Math.floor(a % b)];
    }

    /**
     * @param delay - in milliseconds
     */
    humanReadableDurationFromNow(delay: number): String {
        let [seconds, _ms] = this.eucl(delay, 1000);
        let [minutes, s] = this.eucl(seconds, 60);
        let [hours, m] = this.eucl(minutes, 60);
        let [d, h] = this.eucl(hours, 24);

        return `${d} jours, ${h}h, ${m}m et ${s}s`;
    }

    /**
     *
     */
    async launchReminder(date: Date, user: Discord.User | String, message: String, saveFileId: number): Promise<number> {
        if (this.client.channel === null)
            throw "the bot's configured channel is null";

        const real_delay = date.getTime() - Date.now();
        /* XXX: `setTimeout` internally uses a 32b integer to represent the
        * delay, which means the maximum delay is roughly 24 days. To work
        * around this limitation, we compute the largest representable delay
        * smaller or equal to the real one we want, and then give the actual
        * reminder date to the `remind` function, so that it can choose to
        * actually send the reminder to the channel, or to wait longer by
        * calling `setTimeout` again */
        const capped_delay = capDelayForSetTimeout(real_delay);
        const timeout = setTimeout(
            remind,
            capped_delay,
            user,
            message,
            date,
            saveFileId,
            this.client.channel
        );
        RemindersFile.SAVEID_TO_TIMEOUT.set(saveFileId, timeout);
        return real_delay;
    }

    /**
     * Handle the command
     *
     * @param message - the user message that invoked the command
     * @param args - the arguments the user gave to the command
     */
    async execute(message: Discord.Message, args: Array<string>) {
        const channel = this.client.channel;
        if (channel === null)
            throw "the bot's configured channel is null";
        if (message.channel != this.client.channel) {
            return channel?.send(
                `Désolé, je n'accepte cette commande que sur mon salon principal : ${channel}`
            );
        }

        var ping_user: Discord.User | string | Error = await this.getUser(args[0]);
        if (isError(ping_user))
            return channel.send(ping_user.message);

        var ping_username: string;
        if (ping_user instanceof Discord.User) {
            ping_username = ping_user.displayName;
        }
        else {
            ping_username = ping_user;
            ping_user = `@${ping_user}`;
        }

        // parse the date
        const ping_date = this.parseDateTimeArg(args[1], args[2]);
        if (ping_date.toString() == "Invalid Date") {
            return channel.send(`Je n'ai pas compris la date à laquelle le rappel devait être fait`);
        }

        const ping_message = args.slice(3).join(" ");

        const saveFileId = await RemindersFile.addReminder(ping_date, ping_username, ping_message);
        const delay = await this.launchReminder(ping_date, ping_user, ping_message, saveFileId)
        const human_delay = this.humanReadableDurationFromNow(delay);

        return channel.send(
            `Ok, j'ai enregistré le rappel numéro ${saveFileId} : `
            + `je pingerai ${ping_username} avec le message "${ping_message}" à la date suivante : `
            + `${this.client.dateFormater.format(ping_date)} (dans ${human_delay})`
        )
    }
}
