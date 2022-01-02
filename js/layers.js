//import { default as Decimal } from "../node_modules/break_eternity.js"
if (globalThis === undefined) { const { default: Decimal } = require("break_eternity.js") }

var sInYear = new Decimal(31536000)
var sInDay = new Decimal(86400)
var sInHour = new Decimal(3600)
var sInMinute = new Decimal(60)

addLayer("main", {
    startData() {
        return {
            points: new Decimal(0),
            unlocked: true,
            condensedAge: new Decimal(0),
            age: new Decimal(sInYear.mul(20)),
            condensing: false,
        }
    },

    color: "#000080",
    resource: "condensed time",
    row: "none",
    type: "none",

    tabFormat: [
        ["display-text", function() { return `Your time spent is ${formatAge(player["main"].age)}` } ],
        ["display-text", function() { return `Your bottle of time have ${formatAge(player["main"].condensedAge)} inside` } ],
        "blank",
        ["infobox", "condensingInfo"],
        "blank",
        ["clickable", "time-condenser"]
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

    update(diff) {
        player[this.layer].age = player[this.layer].age.add(diff)
        if (player[this.layer].condensing) {
            player[this.layer].age = player[this.layer].age.add(diff * 9)
            player[this.layer].condensedAge = player[this.layer].condensedAge.add(diff)
        }
    }
})

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