
// Betterlog logs to spreadsheet
// See: https://github.com/peterherrmann/BetterLog for code and setup instructions
function setUpLogger() {
    // Put your spreadsheet ID between the single quotes
    Logger = BetterLog.useSpreadsheet('1D0QgOlO0-_wp68tXtdUKBlXgvDwU3TgwtHHZno3EZ2s');

    BetterLog.setLevel("INFO");
    // Trace level logging for development or debugging.
    BetterLog.setLevel("FINEST");  

    return Logger;
}


function getRowDataMap(sheet, calendar, row, header, rowData) {
  mappedRow = new Map();
  mappedRow.set("sheet", sheet);
  mappedRow.set("calendar", calendar);
  mappedRow.set("row", idx2SSRow(row));  // spreadsheet row for these data
  mappedRow.set("idColumn", idx2SSColumn(header.indexOf("Event ID"))); //spreadsheet column for Event ID
  mappedRow.set("id", rowData[header.indexOf("Event ID")]);
  mappedRow.set("status", rowData[header.indexOf("Status")]);
  mappedRow.set("when", rowData[header.indexOf("Date")]);
  mappedRow.set("payee", rowData[header.indexOf("Payee")] || "[ ? ]");
  mappedRow.set("account", rowData[header.indexOf("Account")] || "[ ? ]");
  const amnt = rowData[header.indexOf("Amount")];
  mappedRow.set("amount", amnt ? USDollar.format(amnt) : "[ ? ]");
  return mappedRow;
}


function idx2SSRow(i) {
  return i + 2;
}


function idx2SSColumn(i) {
  return i + 1;
}


function formatDate(inDate) {
  return inDate.toLocaleDateString('en-us', { weekday: "long", year: "numeric", month: "short", day: "numeric" });
}


// formats number to US dollar
const USDollar = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});


function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Sync to Calendar')
    .addItem('Schedule bills', 'scheduleBills')
    .addToUi();
}

