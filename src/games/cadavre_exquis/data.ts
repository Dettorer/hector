import * as Discord from "discord.js";

export default {
    parts: new Discord.Collection([
        ["S", "sujet"],
        ["Se", "attribut du sujet"],
        ["V", "verbe"],
        ["C", "complément d'objet"],
        ["Ce", "attribut du complément d'objet"],
        ["Cc", "complément circonstentiel (temps, lieu, manière, cause, …)"]
    ]),

    subjectParts: new Set(["S", "Se", "V"]),

    examples: new Discord.Collection([
        ["S", ["Les sorcières", "La voisine", "Les marchands", "Le pape"]],
        ["Se", ["chamboulées", "toute jaune", "muets", "confiant"]],
        ["V", ["sont amusées par", "est émue par", "s'amusent avec", "parle avec"]],
        ["C", ["des sirènes", "une veuve", "des hommes", "le père Noël"]],
        ["Ce", ["muettes", "apeurée", "terrifiés", "inquiet"]],
        ["Cc", ["près du lampadaire", "la veille de Noël", "sans bouger"]]
    ]),

    modes: new Discord.Collection([
        [3, ["S", "V", "C"]],
        [4, ["S", "Se", "V", "C"]],
        [5, ["S", "Se", "V", "C", "Ce"]],
        [6, ["S", "Se", "V", "C", "Ce", "Cc"]]
    ])
}
