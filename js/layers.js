//import { default as Decimal } from "../node_modules/break_eternity.js"
if (globalThis === undefined) { const { default: Decimal } = require("break_eternity.js") }

var sInYear = new Decimal(31536000)
var sInDay = new Decimal(86400)
var sInHour = new Decimal(3600)
var sInMinute = new Decimal(60)

var formatAge = function(age) {
    let dec = new Decimal(age)

    let years = dec.div(sInYear).floor()
    dec = dec.sub(sInYear.mul(years))

    let days = dec.div(sInDay).floor()
    dec = dec.sub(sInDay.mul(days))

    let hours = dec.div(sInHour).floor()
    dec = dec.sub(sInHour.mul(hours))

    let minutes = dec.div(sInMinute).floor()
    dec = dec.sub(sInMinute.mul(minutes))

    let seconds = dec

    let r = ""
    if (years.gt(0)) r += `${formatWhole(years)} years `
    if (days.gt(0)) r += `${formatWhole(days)} days `
    if (hours.gt(0)) r += `${formatWhole(hours)} hours `
    if (minutes.gt(0)) r += `${formatWhole(minutes)} minutes `
    if (seconds.gt(0)) r += `${formatWhole(seconds)} seconds`
    return r === '' ? "0 seconds" : r 
}

addLayer("main", {
    startData() {
        return {
            points: new Decimal(0),
            unlocked: true,
            condensedAge: new Decimal(0),
            age: new Decimal(sInYear.mul(20)),
            condensing: false,
            expectedDeath: new Decimal(sInYear.mul(50))
        }
    },

    color: "#ADD8E6",
    row: "none",
    type: "none",

    tabFormat: [
        ["display-text", function() { return `Your have spent ${formatAge(player["main"].age)} of ${formatAge(player["main"].expectedDeath)} of your life` } ],
        ["display-text", function() { return `Your bottle of time have ${formatAge(player["main"].condensedAge)} inside` } ],
        "blank",
        ["infobox", "condensingInfo"],
        "blank",
        ["clickable", "time-condenser"],
        "blank",
        ["microtabs", "mur"]
    ],

    clickables: {
        "time-condenser": {
            display() { return player[this.layer].condensing ? "Click this to stop condensing time" : "Click this to condense your time" },
            canClick() { return true},
            onClick() { player[this.layer].condensing = !player[this.layer].condensing}
        },
    },

    infoboxes: {
        "condensingInfo": {
            title: "Time in a bottle",
            body() {
                return `
                You have learned ancient technique of condensing time to a bottle.
                Sadly, you can't create something from nothing. Condensing time to bottle
                makes you age 10 times as fast. On the other hand, people will gladly buy
                some time. 
                `
            }
        },
    },

    microtabs: {
        "mur": { // <- Money-Upgrades-Research
            money: {
                embedLayer: "money",
                buttonStyle: {
                    "border-color": "#FFD700"
                }
            },
            research: {
                embedLayer: "research",
                buttonStyle: {
                    "border-color": "#ff3300"
                },
                unlocked() { return getBuyableAmount("money", "researchTable").gte(1) }
            }
        }
    },

    condensingEffectiveness() {
        return new Decimal(1)
    },

    update(diff) {
        if (player[this.layer].condensing) {
            player[this.layer].age = player[this.layer].age.add(tmp.main.condensingEffectiveness.mul(10).mul(diff))
            player[this.layer].condensedAge = player[this.layer].condensedAge.add(tmp.main.condensingEffectiveness.mul(diff))
        } else {
            player[this.layer].age = player[this.layer].age.add(diff)
        }
    }
})

addLayer("money", {
    startData() {
        return {
            unlocked: true,
            points: new Decimal(0),
            money: new Decimal(0)
        }
    },

    color: "#FFD700",
    type: "none",
    row: "none",

    tabFormat: [
        ["infobox", "money mechanics"],
        "blank",
        ["display-text", function() { return `You have ${formatWhole(player.money.money)} coins` }],
        "blank",
        ["clickable", "sellTime"],
        "blank",
        ["buyable", "researchTable"]
    ],

    clickables: {
        "sellTime": {
            display() { return "Click this to sell one second from your condensed time for 1 coin" },
            canClick() { return player.main.condensedAge.gte(1) },
            onClick() {
                player.main.condensedAge = player.main.condensedAge.sub(1)
                player.money.money = player.money.money.add(1)
            }
        }
    },

    buyables: {
        "researchTable": {
            title: "Research table",
            display() {return getBuyableAmount(this.layer, this.id).gte(1) ? `Upgrading your table will double your research speed<br><br><h2>Cost:</h2> ${format(tmp[this.layer].buyables[this.id].cost)}` : `Buying this will allow you to study the power of condensed time<br><br><h2>Cost:</h2> ${format(tmp[this.layer].buyables[this.id].cost)}`},
            cost(x) { return new Decimal(10).pow(x.add(1)) },
            canAfford() { return player[this.layer].money.gte(tmp[this.layer].buyables[this.id].cost) },
            buy() { 
                player[this.layer].money = player[this.layer].money.sub(tmp[this.layer].buyables[this.id].cost)
                addBuyables(this.layer, this.id, 1)
            },
            effect() { return new Decimal(2).pow(getBuyableAmount(this.layer, this.id)) },
            purchaseLimit() { return hasUpgrade("research", "tde1") ? new Decimal(Infinity) : new Decimal(1) }
        }
    },

    infoboxes: {
        "money mechanics": {
            title: "money mechanics",
            body() {
                return `
                Here you can trade your condensed time to money! At start, you don't have
                big reputation, so you sell locally, but after gaining some initial cash you
                will be able to gain trading licence, which allows you to trade with stocks.
                `
            }
        }
    },
})

addLayer("research", {
    startData() {
        return {
            unlocked: true,
            points: new Decimal(0),
            researching: "",
            storedRP: new Decimal(0),
            speedingUp: false
        }
    },

    color: "#FF3300",
    type: "none",
    row: "none",

    tabFormat: [
        ["infobox", "research"],
        "blank",
        ["row", [
            ["bar", "currentResearch"],
            ["clickable", "speedUpResearch"]
        ]],
        ["upgrade", "amp"],
        "blank",
        ["row", [
            ["upgrade", "addamp"],
            "blank",
            ["upgrade", "spd"],
            "blank",
            ["upgrade", "mult"],
            "blank",
            ["upgrade", "eff"],
        ]],
        "blank",
        ["upgrade", "tde1"],
        "blank",
        ["row", [
            ["upgrade", "tc1"],
            "blank", 
            ["upgrade", "mem1"],
        ]],
        "blank",
        ["row", [
            ["upgrade", "tc2"],
            "blank",
            ["upgrade", "mem2"]
        ]],
        "blank",
        ["upgrade", "tde2"]
    ],

    upgrades: {

    },

    clickables: {
        "speedUpResearch": {
            display() { return player[this.layer].speedingUp ? `Click this to stop boosting research` : `Click this to boost research`},
            canClick() { return true },
            onClick() { player[this.layer].speedingUp = !player[this.layer].speedingUp }
        }
    },

    bars: {
        "currentResearch": {
            direction: RIGHT,
            width: 500,
            height: 50,
            progress() { return player[this.layer].storedRP.div(tmp[this.layer].upgrades[player[this.layer].researching]?.neededRP == undefined ? Infinity : tmp[this.layer].upgrades[player[this.layer].researching]?.neededRP) },
            display() { return `Currently researching: ${player[this.layer].researching == "" ? "nothing" : player[this.layer].researching}` },
            fillStyle: {
                "color": "#FF3300",
            },
            borderStyle: {
                "border-color": "#FF3300",
            }
        }
    },

    infoboxes: {
        "research": {
            title: "Research",
            body() {
                return `
                Here you can research new things! But alone it would take too much time. 
                Maybe you can utilize some of your condensed time to speed up research?
                `
            }
        }
    },


})