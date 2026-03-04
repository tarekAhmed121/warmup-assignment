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
    
    // should be from 8 am to 10 pm  
    const deliveryStart = 8 * 3600;   // 8AM = 28800 seconds
    const deliveryEnd = 22 * 3600;    // 10PM = 79200 seconds
    
    let idleBefore = 0;
    let idleAfter = 0;
    
    // Idle time  is before 8 AM and after 10 pm


    if (start < deliveryStart) {
        idleBefore = Math.min(end, deliveryStart) - start;
        if (idleBefore < 0) idleBefore = 0;
    }
    
    
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
  
    // normal days need 8h24m to meet their quota 
//Eid special days need 6 hours to meet their quota which is  from 10th April to 30th April 2025 inclusive
    const parts = date.split("-").map(Number); 
    const [yr, mo, day] = parts;
    let quotaSec;
    if (yr === 2025 && mo === 4 && day >= 10 && day <= 30) {
        quotaSec = 6 * 3600;
    } else {
        quotaSec = 8 * 3600 + 24 * 60;
    }

    const activeSec = parseHMS(activeTime);
    return activeSec >= quotaSec;
}

// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
function addShiftRecord(textFile, shiftObj) {
    // read the file
    let fileContent = fs.readFileSync(textFile, { encoding: 'utf8' });
    let lines = fileContent.trim().split('\n');
    
    // check for duplicate (same driverID and date)
    for (let i = 1; i < lines.length; i++) {
        let parts = lines[i].split(',');
        if (parts[0] === shiftObj.driverID && parts[2] === shiftObj.date) {
            return {};  // duplicate found
        }
    }
    
    // calculate derived fields
    const shiftDuration = getShiftDuration(shiftObj.startTime, shiftObj.endTime);
    const idleTime = getIdleTime(shiftObj.startTime, shiftObj.endTime);
    const activeTime = getActiveTime(shiftDuration, idleTime);
    const metQuotaResult = metQuota(shiftObj.date, activeTime);
    const hasBonus = false;
    
    // create result object with 10 properties
    const resultObj = {
        driverID: shiftObj.driverID,
        driverName: shiftObj.driverName,
        date: shiftObj.date,
        startTime: shiftObj.startTime,
        endTime: shiftObj.endTime,
        shiftDuration: shiftDuration,
        idleTime: idleTime,
        activeTime: activeTime, 
        metQuota: metQuotaResult,
        hasBonus: hasBonus
    };
    
    // format as CSV line and append to file
    const csvLine = `${resultObj.driverID},${resultObj.driverName},${resultObj.date},${resultObj.startTime},${resultObj.endTime},${resultObj.shiftDuration},${resultObj.idleTime},${resultObj.activeTime},${resultObj.metQuota},${resultObj.hasBonus}`;
    fs.appendFileSync(textFile, '\n' + csvLine);
    
    return resultObj;
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
    // read the file
    let fileContent = fs.readFileSync(textFile, { encoding: 'utf8' });
    let lines = fileContent.trim().split('\n');
    
    // find and update the matching record
    for (let i = 1; i < lines.length; i++) {
        let parts = lines[i].split(',');
        if (parts[0] === driverID && parts[2] === date) {  //checks if theres same driverID and date 
            
            parts[9] = newValue; //if there is it replaces a value with a new value at the back of the array
            
            lines[i] = parts.join(',');
            break;
        }
    }
    
    // write the file back
    fs.writeFileSync(textFile, lines.join('\n'));
}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {

    //reads the text file and splits it into lines
    const fileContent = fs.readFileSync(textFile, { encoding: "utf8" });
    const lines = fileContent.trim().split("\n");
// makes the month in a 2 digit format
    const targetMonth = String(month).padStart(2, "0");
    let driverFound = false;
    let bonusCount = 0;
//checks to see if the driver Id is the same as the one in the text file and same thing for the month 
    for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",");
        const rowDriverID = parts[0];
        const rowDate = parts[2];
        const rowHasBonus = String(parts[9]).trim().toLowerCase();

        if (rowDriverID !== driverID) continue;

        driverFound = true;
        const rowMonth = String(Number(rowDate.split("-")[1])).padStart(2, "0");

        if (rowMonth === targetMonth && rowHasBonus === "true") {
            bonusCount++;
        }
    }
// if doesnt exit return -1
    if (!driverFound) return -1;
    return bonusCount;
}

// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {

    //reads the text file 
    const fileContent = fs.readFileSync(textFile, { encoding: "utf8" });
    const lines = fileContent.split("\n");
//makes the month in a 2 digit format
    const targetMonth = String(month).padStart(2, "0");
    let totalActiveSeconds = 0;// attribute for the active seconds 



    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(",");
        if (parts.length < 8) continue;

        const rowDriverID = parts[0];
        const rowDate = parts[2];
        if (!rowDate || rowDate.indexOf("-") === -1) continue;

        const rowMonth = String(Number(rowDate.split("-")[1])).padStart(2, "0");
        const rowActiveTime = parts[7];

        if (rowDriverID === driverID && rowMonth === targetMonth) {  //if same driver id and month then calculate active seconds
            totalActiveSeconds += parseHMS(rowActiveTime);
        }
    }

    return formatHMS(totalActiveSeconds);  //return the active seconds in the correct format (hours minutes seconds)
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
    // reads the rate  file 
    const rateContent = fs.readFileSync(rateFile, { encoding: "utf8" });
    const rateLines = rateContent.split("\n");

    let dayOff = "";
    // handles the case whether the driver has a day off or not 
    for (let i = 0; i < rateLines.length; i++) {
        const line = rateLines[i].trim();
        if (!line) continue;
        const parts = line.split(",");
        if (parts[0] === driverID) {
            dayOff = parts[1];
            break;
        }
    }
// reads shift text file
    const fileContent = fs.readFileSync(textFile, { encoding: "utf8" });
    const lines = fileContent.split("\n");
    const targetMonth = String(month).padStart(2, "0");// makes the month in a 2 digit format

    let requiredSeconds = 0;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;//checks if line is empty

        const parts = line.split(",");
        if (parts.length < 3) continue;
            
        const rowDriverID = parts[0];
        const rowDate = parts[2];
        if (rowDriverID !== driverID) continue;// checks if the driver id is the same as the one in the text file
        if (!rowDate || rowDate.indexOf("-") === -1) continue; //checks format of the date

        const dateParts = rowDate.split("-").map(Number);
        const year = dateParts[0];
        const rowMonth = String(dateParts[1]).padStart(2, "0");
        const day = dateParts[2];

        if (rowMonth !== targetMonth) continue;

        const weekDayName = new Date(rowDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long" });
        if (dayOff && weekDayName === dayOff) continue;

        const isEidDay = year === 2025 && Number(rowMonth) === 4 && day >= 10 && day <= 30;
        if (isEidDay) {
            requiredSeconds += 6 * 3600;  //because eid needs only 6 hours to meet the quota
        } else {
            requiredSeconds += 8 * 3600 + 24 * 60; // normal days need 8 hours and 24 minutes to meet the quota
        }
    }

    const bonusSeconds = Math.max(0, Number(bonusCount) || 0) * 2 * 3600;
    requiredSeconds = Math.max(0, requiredSeconds - bonusSeconds);

    return formatHMS(requiredSeconds);
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
    const rateContent = fs.readFileSync(rateFile, { encoding: "utf8" });
    const lines = rateContent.split("\n");

    let basePay = -1;
    let tier = -1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(",");
        if (parts[0] === driverID) {
            basePay = Number(parts[2]);
            tier = Number(parts[3]);
            break;
        }
    }

    if (basePay < 0 || tier < 0) return -1;

    const actualSeconds = parseHMS(actualHours);
    const requiredSeconds = parseHMS(requiredHours);

    if (actualSeconds >= requiredSeconds) return basePay;

    let allowedMissingHours = 0;
    if (tier === 1) allowedMissingHours = 50;
    else if (tier === 2) allowedMissingHours = 20;
    else if (tier === 3) allowedMissingHours = 10;
    else if (tier === 4) allowedMissingHours = 3;

    const missingSeconds = requiredSeconds - actualSeconds;
    const deductibleSeconds = missingSeconds - allowedMissingHours * 3600;

    if (deductibleSeconds <= 0) return basePay;

    const deductibleHours = Math.floor(deductibleSeconds / 3600);
    if (deductibleHours <= 0) return basePay;

    const deductionRatePerHour = Math.floor(basePay / 185);
    const salaryDeduction = deductibleHours * deductionRatePerHour;

    return basePay - salaryDeduction;
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
