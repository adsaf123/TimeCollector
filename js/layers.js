//import { default as Decimal } from "../node_modules/break_eternity.js"
if (globalThis === undefined) { const { default: Decimal } = require("break_eternity.js") }

var sInYear = new Decimal(31536000)
var sInDay = new Decimal(86400)
var sInHour = new Decimal(3600)
var sInMinute = new Decimal(60)

var cards = {
    "essence": {
        title: "Purity of essence",
        description: "Gain min((condensed time)^(1/10), (condensed time)/10) genomes per second. Cost: 20",
        cost: new Decimal(20),
        id: "essence",
    },
    "chr": {
        title: "Charismatic",
        description: "Gain 50% more coins. Cost: 5",
        cost: new Decimal(5),
        id: "chr",
    },
    "shl": {
        title: "Short lived",
        description: "Life expectancy decreased by 15%. Cost: 5",
        cost: new Decimal(5),
        id: "shl",
    },
    "lnl": {
        title: "Long lived",
        description: "Life expectancy increased by 15%. Cost: 5",
        cost: new Decimal(5),
        id: "lnl",
    },
    "tml": {
        title: "Time Lord",
        description: "Next time you die, don't reset. Cost: 7",
        cost: new Decimal(7),
        id: "tml",
    },
    "brl": {
        title: "Brilliant",
        description: "RP gain x1.3. Cost: 10",
        cost: new Decimal(10),
        id: "brl",
    },
    "mem": {
        title: "Excellent memory",
        description: "Research penalty x0.9. Cost: 10",
        cost: new Decimal(10),
        id: "mem"
    }
}

var generateCards = function() {
    let list = []
    let num = 3
    if (getBuyableAmount("research", "genm")?.gte(1)) num += 3
    if (getBuyableAmount("research", "agenm")?.gte(1)) num += 3
    for (let i = 0; i < num; i++) {
        let keys = Object.keys(cards)
        list.push({...cards[keys[keys.length * Math.random() << 0]]})
    }
    player.death.shownCards = list
}

var formatAge = function (age) {
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
            condensedTime: new Decimal(0),
            age: new Decimal(sInYear.mul(40)),
            condensing: false,
            expectedDeath: new Decimal(sInYear.mul(50))
        }
    },

    color: "#ADD8E6",
    row: "none",
    type: "none",

    tabFormat: [
        ["display-text", function () { return `Your have spent ${formatAge(player["main"].age)} of ${formatAge(player["main"].expectedDeath)} of your life` }],
        ["display-text", function () { return `Your bottle of time have ${formatAge(player["main"].condensedTime)} inside` }],
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
            canClick() { return true },
            onClick() { player[this.layer].condensing = !player[this.layer].condensing }
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
            },
            upgrades: {
                embedLayer: "upgrades",
                unlocked() { return getBuyableAmount("research", "spd").gte(1) || getBuyableAmount("research", "mult").gte(1) || getBuyableAmount("research", "eff").gte(1) }
            }
        }
    },

    condensingEffectiveness() {
        return new Decimal(1).mul(tmp.upgrades.allMults.speed).mul(tmp.upgrades.allMults.mult)
    },

    condensingEfficiency() {
        return new Decimal(1).mul(tmp.upgrades.allMults.efficiency).max(0.1)
    },

    update(diff) {
        if (player[this.layer].condensing) {
            player[this.layer].age = player[this.layer].age.add(tmp.main.condensingEfficiency.mul(10).mul(diff))
            player[this.layer].condensedTime = player[this.layer].condensedTime.add(tmp.main.condensingEffectiveness.mul(diff))
        } else {
            player[this.layer].age = player[this.layer].age.add(diff)
        }
    },
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
        ["display-text", function () { return `You have ${formatWhole(player.money.money)} coins` }],
        "blank",
        ["clickable", "sellTime"],
        "blank",
        ["buyable", "researchTable"]
    ],

    clickables: {
        "sellTime": {
            display() { return "Click this to sell one second from your condensed time for 1 coin" },
            canClick() { return player.main.condensedTime.gte(1) },
            onClick() {
                player.main.condensedTime = player.main.condensedTime.sub(1)
                player.money.money = player.money.money.add(new Decimal(1).mul(new Decimal(1.5).pow(player.death.effects.chr)))
            }
        }
    },

    buyables: {
        "researchTable": {
            title: "Research table",
            display() { return getBuyableAmount(this.layer, this.id).gte(1) ? `Upgrading your table will double your research speed<br><br><h2>Cost:</h2> ${format(tmp[this.layer].buyables[this.id].cost)}` : `Buying this will allow you to study the power of condensed time<br><br><h2>Cost:</h2> ${format(tmp[this.layer].buyables[this.id].cost)}` },
            cost(x) { return new Decimal(6).pow(x.add(1)) },
            canAfford() { return player[this.layer].money.gte(tmp[this.layer].buyables[this.id].cost) },
            buy() {
                player[this.layer].money = player[this.layer].money.sub(tmp[this.layer].buyables[this.id].cost)
                addBuyables(this.layer, this.id, 1)
            },
            effect() { return new Decimal(2).pow(getBuyableAmount(this.layer, this.id).sub(1)) },
            purchaseLimit() { return getBuyableAmount("research", "tde").gte(1) ? new Decimal(Infinity) : new Decimal(1) }
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
            numOfResearched: new Decimal(0),
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
        ["buyable", "amp"],
        "blank",
        ["row", [
            ["buyable", "addamp"],
            ["blank", ["50px", "1px"]],
            ["buyable", "spd"],
            ["blank", ["50px", "1px"]],
            ["buyable", "mult"],
            ["blank", ["50px", "1px"]],
            ["buyable", "eff"],
        ]],
        "blank",
        ["buyable", "tde"],
        "blank",
        // ["row", [
        //     ["buyable", "tc1"],
        //     "blank",
        //     ["buyable", "mem1"],
        // ]],
        // "blank",
        // ["row", [
        //     ["buyable", "tc2"],
        //     "blank",
        //     ["buyable", "mem2"]
        // ]],
        // "blank",
        // ["buyable", "tde2"]
    ],

    penalty() {
        return new Decimal(new Decimal(1.5).mul(new Decimal(0.9).pow(player.death.effects.mem))).pow(player.research.numOfResearched)
    },

    buyables: {
        "amp": {
            title: "Amplifying time flow",
            display() { return `This will allow you to better utilize the aspect of time<br><br><h2>Cost:</h2> ${format(tmp[this.layer].buyables[this.id].cost)}RP` },
            cost() { return new Decimal(100).mul(tmp.research.penalty) },
            canAfford() { return true },
            buy() {
                if (player.research.researching === this.id)
                    return
                player.research.researching = this.id
                player.research.storedRP = new Decimal(0)
            },
            purchaseLimit: new Decimal(1),
            unlocked() { return true },
            branches: ["addamp", "spd", "mult", "eff"],
        },

        "addamp": {
            title: "Additional amplifying",
            display() { return `This will allow you to merge upgrades to increase their tier<br><br><h2>Cost:</h2> ${format(tmp[this.layer].buyables[this.id].cost)}RP` },
            cost() { return new Decimal(500).mul(tmp.research.penalty) },
            canAfford() { return getBuyableAmount(this.layer, "amp").gte(1) },
            buy() {
                if (player.research.researching === this.id)
                    return
                player.research.researching = this.id
                player.research.storedRP = new Decimal(0)
            },
            purchaseLimit: new Decimal(1),
            unlocked() { return true },
            branches: ["tde"],
        },

        "spd": {
            title: "Speed upgrade",
            display() { return `This will allow you to increase speed of condensing time at the cost of decreased efficiency<br><br><h2>Cost:</h2> ${format(tmp[this.layer].buyables[this.id].cost)}RP` },
            cost() { return new Decimal(300).mul(tmp.research.penalty) },
            canAfford() { return getBuyableAmount(this.layer, "amp").gte(1) },
            buy() {
                if (player.research.researching === this.id)
                    return
                player.research.researching = this.id
                player.research.storedRP = new Decimal(0)
            },
            purchaseLimit: new Decimal(1),
            unlocked() { return true },
            branches: ["tde"],
        },

        "mult": {
            title: "Multiplying upgrade",
            display() { return `This will allow you to increse condensed time gain at the cost of speed<br><br><h2>Cost:</h2> ${format(tmp[this.layer].buyables[this.id].cost)}RP` },
            cost() { return new Decimal(300).mul(tmp.research.penalty) },
            canAfford() { return getBuyableAmount(this.layer, "amp").gte(1) },
            buy() {
                if (player.research.researching === this.id)
                    return
                player.research.researching = this.id
                player.research.storedRP = new Decimal(0)
            },
            purchaseLimit: new Decimal(1),
            unlocked() { return true },
            branches: ["tde"],
        },

        "eff": {
            title: "Efficiency upgrade",
            display() { return `This will allow you to increase efficiency of condensing time at the cost gain<br><br><h2>Cost:</h2> ${format(tmp[this.layer].buyables[this.id].cost)}RP` },
            cost() { return new Decimal(300).mul(tmp.research.penalty) },
            canAfford() { return getBuyableAmount(this.layer, "amp").gte(1) },
            buy() {
                if (player.research.researching === this.id)
                    return
                player.research.researching = this.id
                player.research.storedRP = new Decimal(0)
            },
            purchaseLimit: new Decimal(1),
            unlocked() { return true },
            branches: ["tde"],
        },

        "tde": {
            title: "Solving time dilating equations",
            display() { return `Allows you to upgrade research table<br><br><h2>Cost:</h2> ${format(tmp[this.layer].buyables[this.id].cost)}RP` },
            cost() { return new Decimal(900).mul(tmp.research.penalty) },
            canAfford() { return getBuyableAmount(this.layer, "addamp").gte(1) || getBuyableAmount(this.layer, "spd").gte(1) || getBuyableAmount(this.layer, "mult").gte(1) || getBuyableAmount(this.layer, "eff").gte(1) },
            buy() {
                if (player.research.researching === this.id)
                    return
                player.research.researching = this.id
                player.research.storedRP = new Decimal(0)
            },
            purchaseLimit: new Decimal(1),
            unlocked() { return getBuyableAmount(this.layer, "amp").gte(1) },
            branches: [],
        }
    },

    clickables: {
        "speedUpResearch": {
            display() { return player[this.layer].speedingUp ? `Click this to stop boosting research` : `Click this to boost research` },
            canClick() { return true },
            onClick() { player[this.layer].speedingUp = !player[this.layer].speedingUp }
        }
    },

    bars: {
        "currentResearch": {
            direction: RIGHT,
            width: 500,
            height: 50,
            progress() { return player[this.layer].storedRP.div(tmp[this.layer].buyables[player[this.layer].researching]?.cost == undefined ? Infinity : tmp[this.layer].buyables[player[this.layer].researching]?.cost) },
            display() { return `Currently researching: ${player[this.layer].researching == "" ? "nothing" : tmp.research.buyables[player[this.layer].researching].title}` },
            fillStyle: {
                "background-color": "#FF3300",
            },
            borderStyle: {
                "border-color": "#FF3300",
            },
        }
    },

    infoboxes: {
        "research": {
            title: "Research",
            body() {
                return `
                Here you can research new things! But alone it would take too much time. 
                Maybe you can utilize some of your condensed time to speed up research?
                Using this whole time makes you forget things, so if you choose another
                before completing the one you are researching at the moment, you will
                lose all the progress. And of course you have finite capacity of your brain,
                so every thing you learn will increase cost of others.
                `
            }
        }
    },

    researchBase() {
        return new Decimal(1).mul(tmp.money.buyables.researchTable.effect)
    },

    researchSpeedUp() {
        return new Decimal(10)
    },

    researchSpeedUpCost() {
        return new Decimal(2)
    },

    update(diff) {
        if (player.research.researching != "") {
            if (player.research.speedingUp && player.main.condensedTime.gte(tmp.research.researchSpeedUpCost.mul(diff))) {
                player.main.condensedTime = player.main.condensedTime.sub(tmp.research.researchSpeedUpCost.mul(diff))
                player.research.storedRP = player.research.storedRP.add(tmp.research.researchBase.mul(tmp.research.researchSpeedUp).mul(diff))
            } else {
                player.research.storedRP = player.research.storedRP.add(tmp.research.researchBase.mul(diff).mul(new Decimal(1.3).pow(player.death.effects.brl)))
            }

            if (player.research.storedRP.gte(tmp.research.buyables[player.research.researching].cost)) {
                setBuyableAmount("research", player.research.researching, new Decimal(1))
                player.research.numOfResearched = player.research.numOfResearched.add(1)
                player.research.storedRP = new Decimal(0)
                player.research.researching = ""
            }
        }
    },

    componentStyles: {
        buyable() {
            return {
                width: "150px",
                height: "150px"
            }
        }
    }
})

addLayer("upgrades", {
    startData() {
        return {
            unlocked: true,
            points: new Decimal(0),
            selectedUpgrade: -1,
            fromWhat: "",
            mode: "swapping",
            amplifiedNum: new Decimal(0)

        }
    },

    color: "#ADD8E6",
    type: "none",
    row: "none",

    tabFormat: [
        ["infobox", "upgrades"],
        "blank",
        "grid",
        "blank",
        ["row", [
            ["clickable", "mode"],
            ["clickable", "spd"],
            ["clickable", "mult"],
            ["clickable", "eff"]
        ]],
        "blank",
        ["display-text", function() {return `Speed mult: ${format(tmp.upgrades.allMults.speed)}, gain mult: ${format(tmp.upgrades.allMults.mult)}, efficiency mult: ${format(tmp.upgrades.allMults.efficiency)}`}],
        "blank",
        ["display-text", "This is storage, it is default buy destination. You can merge upgrades inside storage, but their effects don't apply"],
        "blank",
        ["layer-proxy", ["storage", ["grid"]]]

    ],

    speedMult() {
        let spdMult = new Decimal(1)
        let effMult = new Decimal(1)

        for (let x = 1; x < 10; x++) {
            for (let y = 1; y < 10; y++) {
                let data = getGridData("upgrades", x * 100 + y)
                if (data !== undefined) {
                    if (data.upgradeID == "spd") {
                        spdMult = spdMult.mul(new Decimal(.05).mul((new Decimal(3).pow(data.upgradeTier-1).mul(data.amplified ? 2 : 1))).add(1))
                        effMult = effMult.mul(new Decimal(.10).mul((new Decimal(3).pow(data.upgradeTier-1).mul(data.amplified ? 2 : 1))).add(1))
                    }
                }
            }
        }

        return {
            speed: spdMult,
            efficiency: effMult
        }
    },

    gainMult() {
        let spdMult = new Decimal(1)
        let gainMult = new Decimal(1)

        for (let x = 1; x < 10; x++) {
            for (let y = 1; y < 10; y++) {
                let data = getGridData("upgrades", x * 100 + y)
                if (data !== undefined) {
                    if (data.upgradeID == "mult") {
                        spdMult = spdMult.mul(new Decimal(1).sub(new Decimal(0.1).mul((new Decimal(3).pow(data.upgradeTier-1).mul(data.amplified ? 2 : 1)))))
                        gainMult = gainMult.mul(new Decimal(.05).mul((new Decimal(3).pow(data.upgradeTier-1).mul(data.amplified ? 2 : 1))).add(1))
                    }
                }
            }
        }

        return {
            multiplier: gainMult,
            speed: spdMult
        }
    },

    efficiencyMult() {
        let gainMult = new Decimal(1)
        let effMult = new Decimal(1)

        for (let x = 1; x < 10; x++) {
            for (let y = 1; y < 10; y++) {
                let data = getGridData("upgrades", x * 100 + y)
                if (data !== undefined) {
                    if (data.upgradeID == "eff") {
                        effMult = effMult.mul(new Decimal(1).sub(new Decimal(0.1).mul((new Decimal(3).pow(data.upgradeTier-1).mul(data.amplified ? 2 : 1)))))
                        gainMult = gainMult.mul(new Decimal(1).sub(new Decimal(0.05).mul((new Decimal(3).pow(data.upgradeTier-1).mul(data.amplified ? 2 : 1)))))
                    }
                }
            }
        }

        return {
            multiplier: gainMult,
            efficiency: effMult
        }
    },

    allMults() {
        return {
            speed: tmp.upgrades.speedMult.speed.mul(tmp.upgrades.gainMult.speed).max(0.1),
            mult: tmp.upgrades.gainMult.multiplier.mul(tmp.upgrades.efficiencyMult.multiplier).max(0.1),
            efficiency: tmp.upgrades.speedMult.efficiency.mul(tmp.upgrades.efficiencyMult.efficiency).max(0.1)
        }
    },

    clickables: {
        "mode": {
            display() { return `MODE: ${player.upgrades.mode}` },
            canClick() { return true },
            onClick() { 
                switch (player.upgrades.mode) {
                    case "destroying":
                        if (getBuyableAmount("research", "addamp").gte(1))
                            player.upgrades.mode = "amplifying"
                        else
                        player.upgrades.mode = "swapping"
                        break
                    case "amplifying":
                        player.upgrades.mode = "swapping"
                        break
                    case "swapping":
                        player.upgrades.mode = "merging"
                        break
                    case "merging":
                        player.upgrades.mode = "destroying"
                        break
                }
            }
        },

        "spd": {
            display() { return `Buy speed upgrade for 5 money and 2s of condensed time` },
            canClick() { return player.money.money.gte(5) && player.main.condensedTime.gte(2) && getBuyableAmount("research", "spd").gte(1) },
            onClick() {
                player.money.money = player.money.money.sub(5)
                player.main.condensedTime = player.main.condensedTime.sub(2)   
                addUpgrade("spd")
            },
            style: { "background-color": "#FF0000" }
        },

        "mult": {
            display() { return `Buy gain upgrade for 5 money and 2s of condensed time` },
            canClick() { return player.money.money.gte(5) && player.main.condensedTime.gte(2) && getBuyableAmount("research", "mult").gte(1) },
            onClick() {
                player.money.money = player.money.money.sub(5)
                player.main.condensedTime = player.main.condensedTime.sub(2)   
                addUpgrade("mult")
            },
            style: { "background-color": "#0000FF" }
        },

        "eff": {
            display() { return `Buy efficiency upgrade for 5 money and 2s of condensed time` },
            canClick() { return player.money.money.gte(5) && player.main.condensedTime.gte(2) && getBuyableAmount("research", "eff").gte(1) },
            onClick() {
                player.money.money = player.money.money.sub(5)
                player.main.condensedTime = player.main.condensedTime.sub(2)   
                addUpgrade("eff")
            },
            style: { "background-color": "#00FF00" }
        }
    },

    infoboxes: {
        upgrades: {
            title: "Upgrades",
            body() {
                return `
                Here you can upgrade your time condenser! 
                First, you buy blank upgrades using money and empower them using condensed time. 
                Such upgrade will change the way time is flowing, changing stats such as how much time you gain,
                or how much does it cost you. You can also combine upgrades using some of your resources, 
                which will make then stronger. (Merge upgrades of the same tiers to get multiplicative x3 on all effects) 
                (All effects are multiplicative is not on the same upgrade slot unless otherwise stated, eg. 2 x2 speed upgrades = x4) 
                You can also amplify upgrade, which consumes (TIER) of condensed time per second, but makes upgrade 2x stronger (and weaker,
                because negative effects are also increased).
                `
            }
        }
    },

    grid: {
        rows: 1,
        cols: 5,
        maxRows: 5,

        getStartData(id) {
            return {
                upgradeID: "",
                upgradeTier: 0,
                amplified: false
            }
        },

        getCanClick(data, id) { return true },

        onClick(data, id) {
            switch (player.upgrades.mode) {
                case "destroying":
                    setGridData("upgrades", id, {
                        upgradeID: "",
                        upgradeTier: 0,
                        amplified: false
                    })
                    break
                case "amplifying":
                    data.amplified = !data.amplified
                    if (data.amplified) {
                        player.upgrades.amplifiedNum = player.upgrades.amplifiedNum.add(data.upgradeTier)
                    } else {
                        player.upgrades.amplifiedNum = player.upgrades.amplifiedNum.sub(data.upgradeTier)
                    }
                    break
                case "swapping":
                    if (player.upgrades.selectedUpgrade == -1) {
                        player.upgrades.selectedUpgrade = id
                        player.upgrades.fromWhat = "upgrades"
                    } else {
                        tmpData = {...data}
                        setGridData("upgrades", id, getGridData(player.upgrades.fromWhat, player.upgrades.selectedUpgrade))
                        setGridData(player.upgrades.fromWhat, player.upgrades.selectedUpgrade, tmpData)

                        player.upgrades.selectedUpgrade = -1
                        player.upgrades.fromWhat = ""
                    }
                    break
                case "merging":
                    if (player.upgrades.selectedUpgrade == -1) {
                        player.upgrades.selectedUpgrade = id
                        player.upgrades.fromWhat = "upgrades"
                    } else if (player.upgrades.selectedUpgrade !== id || player.upgrades.fromWhat !== "upgrades") {
                        if (data.upgradeID == getGridData(player.upgrades.fromWhat, player.upgrades.selectedUpgrade).upgradeID && 
                            data.upgradeTier == getGridData(player.upgrades.fromWhat, player.upgrades.selectedUpgrade).upgradeTier) {
                                data.upgradeTier++
                                setGridData(player.upgrades.fromWhat, player.upgrades.selectedUpgrade, {
                                    upgradeID: "",
                                    upgradeTier: 0,
                                    amplified: false
                                })
                        }

                        player.upgrades.selectedUpgrade = -1
                        player.upgrades.fromWhat = ""
                    }
            }
        },

        getDisplay(data, id) {
            return (data.amplified ? "A" : "") + (data.upgradeID[0]?.toUpperCase() == undefined ? "" : (data.upgradeID[0]?.toUpperCase() + data.upgradeTier.toString())) 
        },

        getStyle(data, id) {
            if (data.upgradeID == "spd") {
                return {
                    "background-color": "#FF0000"
                }
            } else if (data.upgradeID == "mult") {
                return {
                    "background-color": "#0000FF"
                }
            } else if (data.upgradeID == "eff") {
                return {
                    "background-color": "#00FF00"
                }
            }
        } 
    },

    update(diff) {
        player.main.condensedTime = player.main.condensedTime.sub(player.upgrades.amplifiedNum.mul(diff))
    }
})

addLayer("storage", {
    startData() {
        return {
            unlocked: true,
            points: new Decimal(0)
        }
    },

    color: "#ADD8E6",
    type: "none",
    row: "none",

    tabFormat: [
        "grid"
    ],

    grid: {
        rows: 1,
        cols: 5,
        maxRows: 5,

        getStartData(id) {
            return {
                upgradeID: "",
                upgradeTier: 0,
                amplified: false
            }
        },

        getCanClick(data, id) { return true },

        onClick(data, id) {
            switch (player.upgrades.mode) {
                case "destroying":
                    setGridData("storage", id, {
                        upgradeID: "",
                        upgradeTier: 0,
                        amplified: false
                    })
                    break
                case "amplifying":
                    data.amplified = !data.amplified
                    if (data.amplified) {
                        player.upgrades.amplifiedNum = player.upgrades.amplifiedNum.add(data.upgradeTier)
                    } else {
                        player.upgrades.amplifiedNum = player.upgrades.amplifiedNum.sub(data.upgradeTier)
                    }
                    break
                case "swapping":
                    if (player.upgrades.selectedUpgrade == -1) {
                        player.upgrades.selectedUpgrade = id
                        player.upgrades.fromWhat = "storage"
                    } else {
                        tmpData = {...data}
                        setGridData("storage", id, getGridData(player.upgrades.fromWhat, player.upgrades.selectedUpgrade))
                        setGridData(player.upgrades.fromWhat, player.upgrades.selectedUpgrade, tmpData)

                        player.upgrades.selectedUpgrade = -1
                        player.upgrades.fromWhat = ""
                    }
                    break
                case "merging":
                    if (player.upgrades.selectedUpgrade == -1) {
                        player.upgrades.selectedUpgrade = id
                        player.upgrades.fromWhat = "storage"
                    } else if (player.upgrades.selectedUpgrade !== id || player.upgrades.fromWhat !== "storage") {
                        if (data.upgradeID == getGridData(player.upgrades.fromWhat, player.upgrades.selectedUpgrade).upgradeID && 
                            data.upgradeTier == getGridData(player.upgrades.fromWhat, player.upgrades.selectedUpgrade).upgradeTier) {
                                data.upgradeTier++
                                setGridData(player.upgrades.fromWhat, player.upgrades.selectedUpgrade, {
                                    upgradeID: "",
                                    upgradeTier: 0,
                                    amplified: false
                                })
                        }

                        player.upgrades.selectedUpgrade = -1
                        player.upgrades.fromWhat = ""
                    }
                    break
            }
        },

        getDisplay(data, id) {
            return (data.amplified ? "A" : "") + (data.upgradeID[0]?.toUpperCase() == undefined ? "" : (data.upgradeID[0]?.toUpperCase() + data.upgradeTier.toString())) 
        },

        getStyle(data, id) {
            if (data.upgradeID == "spd") {
                return {
                    "background-color": "#FF0000"
                }
            } else if (data.upgradeID == "mult") {
                return {
                    "background-color": "#0000FF"
                }
            } else if (data.upgradeID == "eff") {
                return {
                    "background-color": "#00FF00"
                }
            }
        } 
    }
})

var addUpgrade = function(type) {
    for(let x = 1; x < 10; x++) {
        for (let y = 1; y < 10; y++) {
            data = getGridData("storage", 100 * x + y)
            if (data !== undefined) {
                if (data.upgradeID === "") {
                    setGridData("storage", 100 * x + y, {
                        upgradeID: type,
                        upgradeTier: 1,
                        amplified: false,
                    })
                    return
                }
            }
        }
    }
}

addLayer("death", {
    startData() {
        return {
            unlocked: true,
            points: new Decimal(0),
            shownCards: [],
            genomes: new Decimal(0),
            effects: {
                "essence": new Decimal(0),
                "chr": new Decimal(0),
                "shl": new Decimal(0),
                "lnl": new Decimal(0),
                "tml": new Decimal(0),
                "brl": new Decimal(0),
                "mem": new Decimal(0),
            },
            timesDied: 0,
        }
    },

    color: "#FFFFFF",
    type: "none",
    row: "none",

    tabFormat: [
        ["infobox", "death"],
        "blank",
        ["display-text", function() { return `You have ${format(player.death.genomes)} genomes` }],
        "blank",
        function() {
            let list = ["column", []]

            for (const card in player.death.shownCards) {
                list[1].push(["row", []])
                list[1][list[1].length-1][1].push(["display-text", player.death.shownCards[card].title])
                list[1][list[1].length-1][1].push("blank")
                list[1][list[1].length-1][1].push(["display-text", player.death.shownCards[card].description])
                list[1][list[1].length-1][1].push("blank")
                list[1][list[1].length-1][1].push(["clickable", `${card}b`])
                list[1][list[1].length-1][1].push(["clickable", `${card}s`])
            }

            return list
        },
        "blank",
        ["clickable", "return"]
    ],

    clickables: {
        "return": {
            display() { return `Begin new life` },
            canClick() { return true },
            onClick() { showNavTab("main") }
        },

        "0b": {
            display() { return `buy` },
            canClick() { return player.death.shownCards[0]?.cost?.lte?.(player.death.genomes)},
            onClick() {
                player.death.genomes = player.death.genomes.sub(player.death.shownCards[0]?.cost)
                player.death.effects[player.death.shownCards[0]?.id] = player.death.effects[player.death.shownCards[0]?.id].add(1)
                player.death.shownCards = player.death.shownCards.filter((v, i) => i != 0)
            },
            style: {"width": "100px", "height": "100px", "min-height": "100px"}
        },

        "0s": {
            display() { return `sell` },
            canClick() { return true},
            onClick() {
                player.death.genomes = player.death.genomes.add(player.death.shownCards[0]?.cost.div(2).floor())
                player.death.shownCards = player.death.shownCards.filter((v, i) => i != 0)
            },
            style: {"width": "100px", "height": "100px", "min-height": "100px"}
        },

        "1b": {
            display() { return `buy` },
            canClick() { return player.death.shownCards[1]?.cost?.lte?.(player.death.genomes)},
            onClick() {
                player.death.genomes = player.death.genomes.sub(player.death.shownCards[1]?.cost)
                player.death.effects[player.death.shownCards[1]?.id] = player.death.effects[player.death.shownCards[1]?.id].add(1)
                player.death.shownCards = player.death.shownCards.filter((v, i) => i != 1)
            },
            style: {"width": "100px", "height": "100px", "min-height": "100px"}
        },

        "1s": {
            display() { return `sell` },
            canClick() { return true},
            onClick() {
                player.death.genomes = player.death.genomes.add(player.death.shownCards[1]?.cost.div(2).floor())
                player.death.shownCards = player.death.shownCards.filter((v, i) => i != 1)
            },
            style: {"width": "100px", "height": "100px", "min-height": "100px"}
        },

        "2b": {
            display() { return `buy` },
            canClick() { return player.death.shownCards[2]?.cost?.lte?.(player.death.genomes)},
            onClick() {
                player.death.genomes = player.death.genomes.sub(player.death.shownCards[2]?.cost)
                player.death.effects[player.death.shownCards[2]?.id] = player.death.effects[player.death.shownCards[2]?.id].add(1)
                player.death.shownCards = player.death.shownCards.filter((v, i) => i != 2)
            },
            style: {"width": "100px", "height": "100px", "min-height": "100px"}
        },

        "2s": {
            display() { return `sell` },
            canClick() { return true},
            onClick() {
                player.death.genomes = player.death.genomes.add(player.death.shownCards[2]?.cost.div(2).floor())
                player.death.shownCards = player.death.shownCards.filter((v, i) => i != 2)
            },
            style: {"width": "100px", "height": "100px", "min-height": "100px"}
        },

        "3b": {
            display() { return `buy` },
            canClick() { return player.death.shownCards[3]?.cost?.lte?.(player.death.genomes)},
            onClick() {
                player.death.genomes = player.death.genomes.sub(player.death.shownCards[3]?.cost)
                player.death.effects[player.death.shownCards[3]?.id] = player.death.effects[player.death.shownCards[3]?.id].add(1)
                player.death.shownCards = player.death.shownCards.filter((v, i) => i != 3)
            },
            style: {"width": "100px", "height": "100px", "min-height": "100px"}
        },

        "3s": {
            display() { return `sell` },
            canClick() { return true},
            onClick() {
                player.death.genomes = player.death.genomes.add(player.death.shownCards[3]?.cost.div(2).floor())
                player.death.shownCards = player.death.shownCards.filter((v, i) => i != 3)
            },
            style: {"width": "100px", "height": "100px", "min-height": "100px"}
        },

        "4b": {
            display() { return `buy` },
            canClick() { return player.death.shownCards[4]?.cost?.lte?.(player.death.genomes)},
            onClick() {
                player.death.genomes = player.death.genomes.sub(player.death.shownCards[4]?.cost)
                player.death.effects[player.death.shownCards[4]?.id] = player.death.effects[player.death.shownCards[4]?.id].add(1)
                player.death.shownCards = player.death.shownCards.filter((v, i) => i != 4)
            },
            style: {"width": "100px", "height": "100px", "min-height": "100px"}
        },

        "4s": {
            display() { return `sell` },
            canClick() { return true},
            onClick() {
                player.death.genomes = player.death.genomes.add(player.death.shownCards[4]?.cost.div(2).floor())
                player.death.shownCards = player.death.shownCards.filter((v, i) => i != 4)
            },
            style: {"width": "100px", "height": "100px", "min-height": "100px"}
        },

        "5b": {
            display() { return `buy` },
            canClick() { return player.death.shownCards[5]?.cost?.lte?.(player.death.genomes)},
            onClick() {
                player.death.genomes = player.death.genomes.sub(player.death.shownCards[5]?.cost)
                player.death.effects[player.death.shownCards[5]?.id] = player.death.effects[player.death.shownCards[5]?.id].add(1)
                player.death.shownCards = player.death.shownCards.filter((v, i) => i != 5)
            },
            style: {"width": "100px", "height": "100px", "min-height": "100px"}
        },

        "5s": {
            display() { return `sell` },
            canClick() { return true},
            onClick() {
                player.death.genomes = player.death.genomes.add(player.death.shownCards[5]?.cost.div(2).floor())
                player.death.shownCards = player.death.shownCards.filter((v, i) => i != 5)
            },
            style: {"width": "100px", "height": "100px", "min-height": "100px"}
        },

        "6b": {
            display() { return `buy` },
            canClick() { return player.death.shownCards[6]?.cost?.lte?.(player.death.genomes)},
            onClick() {
                player.death.genomes = player.death.genomes.sub(player.death.shownCards[6]?.cost)
                player.death.effects[player.death.shownCards[6]?.id] = player.death.effects[player.death.shownCards[6]?.id].add(1)
                player.death.shownCards = player.death.shownCards.filter((v, i) => i != 6)
            },
            style: {"width": "100px", "height": "100px", "min-height": "100px"}
        },

        "6s": {
            display() { return `sell` },
            canClick() { return true},
            onClick() {
                player.death.genomes = player.death.genomes.add(player.death.shownCards[6]?.cost.div(2).floor())
                player.death.shownCards = player.death.shownCards.filter((v, i) => i != 6)
            },
            style: {"width": "100px", "height": "100px", "min-height": "100px"}
        },

        "7b": {
            display() { return `buy` },
            canClick() { return player.death.shownCards[7]?.cost?.lte?.(player.death.genomes)},
            onClick() {
                player.death.genomes = player.death.genomes.sub(player.death.shownCards[7]?.cost)
                player.death.effects[player.death.shownCards[7]?.id] = player.death.effects[player.death.shownCards[7]?.id].add(1)
                player.death.shownCards = player.death.shownCards.filter((v, i) => i != 7)
            },
            style: {"width": "100px", "height": "100px", "min-height": "100px"}
        },

        "7s": {
            display() { return `sell` },
            canClick() { return true},
            onClick() {
                player.death.genomes = player.death.genomes.add(player.death.shownCards[7]?.cost.div(2).floor())
                player.death.shownCards = player.death.shownCards.filter((v, i) => i != 7)
            },
            style: {"width": "100px", "height": "100px", "min-height": "100px"}
        },

        "8b": {
            display() { return `buy` },
            canClick() { return player.death.shownCards[8]?.cost?.lte?.(player.death.genomes)},
            onClick() {
                player.death.genomes = player.death.genomes.sub(player.death.shownCards[8]?.cost)
                player.death.effects[player.death.shownCards[8]?.id] = player.death.effects[player.death.shownCards[8]?.id].add(1)
                player.death.shownCards = player.death.shownCards.filter((v, i) => i != 8)
            },
            style: {"width": "100px", "height": "100px", "min-height": "100px"}
        },

        "8s": {
            display() { return `sell` },
            canClick() { return true},
            onClick() {
                player.death.genomes = player.death.genomes.add(player.death.shownCards[8]?.cost.div(2).floor())
                player.death.shownCards = player.death.shownCards.filter((v, i) => i != 8)
            },
            style: {"width": "100px", "height": "100px", "min-height": "100px"}
        },

    },

    infoboxes: {
        "death": {
            title: "Death",
            body() {
                return `
                You died, but this is not the end. Next generation will be here to continue your work, but they will have to start from the beggining.
                There's one thing you can give them. Using condensed time made you very vulnerable to mutations. You are given few choises based on your researches.
                You can either sell them for half their price(rounded down) in genomes, or buy them using genomes. 
                Each death give you five free genomes, but increases life expectancy by 5 years.
                Unless otherwise stated, all effects stacks.
                `
            }
        }
    },

    update(diff) {
        if (player.main.age.gte(player.main.expectedDeath)) {
            if (player.death.effects.tml.gte(1)) {
                player.death.effects.tml = player.death.effects.tml.sub(1)
            } else {
                layerDataReset("main")
                layerDataReset("money")
                layerDataReset("upgrades")
                layerDataReset("storage")
                layerDataReset("research")
                player.main.expectedDeath = new Decimal(sInYear * 50).add(player.death.timesDied * 5).mul(new Decimal(0.85).pow(player.death.effects.shl)).mul(new Decimal(1.15).pow(player.death.effects.lnl)).max(50)
                player.death.genomes = player.death.genomes.add(5)
            }
            generateCards()
            showNavTab("death")
        }

        if (player.death.effects.essence.gte(1)) {
            player.death.genomes = player.death.genomes.add(player.main.condensedTime.pow(0.1).min(player.main.condensedTime.div(10)).mul(diff))
        }

        if (typeof player.death.shownCards[0]?.cost == "string") {
            for(const card in player.death.shownCards) {
                player.death.shownCards[card].cost = new Decimal(player.death.shownCards[card].cost)
            }
        }
    }

})