module.exports = {
    name: "about",
    description: "affiche des informations génériques sur le bot",
    usage: "",
    minArgs: 0,
    help: "",
    execute(message, args, client) {
        client.bufferizeText("Hector est un bot discord développé par Paul \"Dettorer\" Hervot.");
        client.bufferizeText("Source, informations et signalement de bugs sur github : https://github.com/Dettorer/hector");
        return message.channel.send(client.flushBufferToString());
    },
};