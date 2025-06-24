import fs from "fs";
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

/**
 * Functions to handle the global file that saves the currently running reminders.
 *
 * This allows the bot to remember which reminders it should do even after a restart.
 */
export class RemindersFile {
    static FILENAME = "reminders.json";

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
    help = "La date doit être au format JJ-MM, l'heure au format hh:mm ou hh:mm:ss";

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

    async remind(user: Discord.User | String, message: String, saveFileId: number, channel: Discord.SendableChannels) {
        channel.send(`${user} : ${message}`);
        RemindersFile.removeReminder(saveFileId);
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
        const delay = date.getTime() - Date.now();
        setTimeout(this.remind, delay, user, message, saveFileId, this.client.channel);
        return delay;
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
        const now = new Date(Date.now());
        const [ping_day, ping_month] = args[1].split("-");
        const date_string = `${now.getFullYear()}-${ping_month}-${ping_day}T${args[2]}`
        const ping_date = new Date(date_string);
        if (ping_date.toString() == "Invalid Date") {
            return channel.send(`Je n'ai pas compris à quelle date le rappel devait être fait`);
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
