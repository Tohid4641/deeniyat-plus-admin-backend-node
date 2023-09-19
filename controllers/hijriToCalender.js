
//**********************************************************************************
const hijriToCalendars = async (year, month, day, op = {}) => {
    op.fromCal ??= "islamic-umalqura";   //
    let gD = new Date(Date.UTC(2000, 0, 1));
    gD = new Date(gD.setUTCDate(gD.getUTCDate() +
        ~~(227022 + (year + (month - 1) / 12 + day / 354) * 354.367)));
    const gY = gD.getUTCFullYear(gD) - 2000,
        dFormat = new Intl.DateTimeFormat('en-u-ca-' + op.fromCal, { dateStyle: 'short', timeZone: 'UTC' });
    gD = new Date((gY < 0 ? "-" : "+") + ("00000" + Math.abs(gY)).slice(-6) + "-" + ("0" + (gD.getUTCMonth(gD) + 1)).slice(-2) + "-" + ("0" + gD.getUTCDate(gD)).slice(-2));
    let [iM, iD, iY] = [...dFormat.format(gD).split("/")], i = 0;
    gD = new Date(gD.setUTCDate(gD.getUTCDate() +
        ~~(year * 354 + month * 29.53 + day - (iY.split(" ")[0] * 354 + iM * 29.53 + iD * 1) - 2)));
    while (i < 4) {
        [iM, iD, iY] = [...dFormat.format(gD).split("/")];
        if (iD == day && iM == month && iY.split(" ")[0] == year) return formatOutput(gD);
        gD = new Date(gD.setUTCDate(gD.getUTCDate() + 1)); i++;
    }
    console.log('>>>', "Invalid " + op.fromCal + " date!" + day, month, year);
    return (false);
    // throw new Error("Invalid " + op.fromCal + " date!");
    function formatOutput(gD) {
        return "toCal" in op ? (op.calendar = op.toCal,
            new Intl.DateTimeFormat(op.locale ??= "en", op).format(gD)) : gD;
    }
}


module.exports = {
    hijriToCalendars
}
//**********************************************************************************

