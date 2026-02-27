const fs = require("fs");

// helper to parse a time string with am/pm into seconds since midnight
function parseTimeString(t) {
    t = t.trim();
    let [time, period] = t.split(" ");
    period = period ? period.toLowerCase() : "";
    let [h, m, s] = time.split(":").map(Number);
    if (period === "pm" && h !== 12) h += 12;
    if (period === "am" && h === 12) h = 0;
    return h * 3600 + m * 60 + s;
}

// helper to format seconds into h:mm:ss
function formatHMS(sec) {
    let h = Math.floor(sec / 3600);
    let m = Math.floor((sec % 3600) / 60);
    let s = sec % 60;
    return `${h}:${m.toString().padStart(2, "0")} :${s.toString().padStart(2, "0")}`.replace(" ","");
}

// helper to parse h:mm:ss format to seconds
function parseHMS(str) {
    let [h, m, s] = str.split(":").map(Number);
    return h * 3600 + m * 60 + s;
}

// ============================================================
// Function 1: getShiftDuration(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss

// ============================================================
function getShiftDuration(startTime, endTime) {
    const startSec = parseTimeString(startTime);
    const endSec = parseTimeString(endTime);
    let diff = endSec - startSec;
    if (diff < 0) diff += 24 * 3600; 
    return formatHMS(diff);
}

// ============================================================
// Function 2: getIdleTime(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getIdleTime(startTime, endTime) {
    const start = parseTimeString(startTime);
    const end = parseTimeString(endTime);
    
    // Delivery hours: 8 AM to 10 PM (inclusive)
    const deliveryStart = 8 * 3600;   // 8:00 AM = 28800 seconds
    const deliveryEnd = 22 * 3600;    // 10:00 PM = 79200 seconds
    
    let idleBefore = 0;
    let idleAfter = 0;
    
    // Idle time before 8 AM
    if (start < deliveryStart) {
        idleBefore = Math.min(end, deliveryStart) - start;
        if (idleBefore < 0) idleBefore = 0;
    }
    
    // Idle time after 10 PM
    if (end > deliveryEnd) {
        idleAfter = end - Math.max(start, deliveryEnd);
        if (idleAfter < 0) idleAfter = 0;
    }
    
    const totalIdle = idleBefore + idleAfter;
    return formatHMS(totalIdle);
}

// ============================================================
// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss
// ============================================================
function getActiveTime(shiftDuration, idleTime) {
    const shiftSec = parseHMS(shiftDuration);
    const idleSec = parseHMS(idleTime);
    let activeSec = shiftSec - idleSec;
    if (activeSec < 0) activeSec = 0;
    return formatHMS(activeSec);
}

// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
// ============================================================
function metQuota(date, activeTime) {
    // TODO: Implement this function
}

// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
function addShiftRecord(textFile, shiftObj) {
    // TODO: Implement this function
}

// ============================================================
// Function 6: setBonus(textFile, driverID, date, newValue)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// date: (typeof string) formatted as yyyy-mm-dd
// newValue: (typeof boolean)
// Returns: nothing (void)
// ============================================================
function setBonus(textFile, driverID, date, newValue) {
    // TODO: Implement this function
}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
}

// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
}

// ============================================================
// Function 9: getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month)
// textFile: (typeof string) path to shifts text file
// rateFile: (typeof string) path to driver rates text file
// bonusCount: (typeof number) total bonuses for given driver per month
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {
    // TODO: Implement this function
}

// ============================================================
// Function 10: getNetPay(driverID, actualHours, requiredHours, rateFile)
// driverID: (typeof string)
// actualHours: (typeof string) formatted as hhh:mm:ss
// requiredHours: (typeof string) formatted as hhh:mm:ss
// rateFile: (typeof string) path to driver rates text file
// Returns: integer (net pay)
// ============================================================
function getNetPay(driverID, actualHours, requiredHours, rateFile) {
    // TODO: Implement this function
}

module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};
