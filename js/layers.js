//import { default as Decimal } from "../node_modules/break_eternity.js"

addLayer("main", {
    startData() {
        return {
            points: new Decimal(0),
            unlocked: true
        }
    },

    color: "#000080",
    resource: "condensed time",
    row: "none",
    type: "none",

    tabFormat: [
        ["display-text", () => `Your bottle of time have ${formatAge(player["main"].points)} inside`]
    ]
})

var formatAge = function(age) {
    let dec = new Decimal(age)

    let msInYear = new Decimal(31536000000)
    let msInDay = new Decimal(86400000)
    let msInHour = new Decimal(3600000)
    let msInMinute = new Decimal(60000)
    let msInSecond = new Decimal(1000)

    let years = dec.div(msInYear).floor()
    dec = dec.sub(msInYear.mul(years))

    let days = dec.div(msInDay).floor()
    dec = dec.sub(msInDay.mul(days))

    let hours = dec.div(msInHour).floor()
    dec = dec.sub(msInHour.mul(hours))

    let minutes = dec.div(msInMinute).floor()
    dec = dec.sub(msInMinute.mul(minutes))

    let seconds = dec.div(msInSecond).floor()
    dec = dec.sub(msInSecond.mul(seconds))

    let r = ""
    if (years.gt(0)) r += `${formatWhole(years)} years `
    if (days.gt(0)) r += `${formatWhole(days)} days `
    if (hours.gt(0)) r += `${formatWhole(hours)} hours `
    if (minutes.gt(0)) r += `${formatWhole(minutes)} minutes `
    if (seconds.gt(0)) r += `${formatWhole(years)} seconds`
    return r === '' ? "0 seconds" : r 
}