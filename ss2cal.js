
  function scheduleBills() {

    Logger = BetterLog.useSpreadsheet('18lWGMrDnVb28SOqZi7eXyY0nQOrYJ5x_fF7vroJHn6I');
    BetterLog.setLevel("INFO");

    /**
     *  Open the Spreadsheet and the Calendar
     */
    const sheet = SpreadsheetApp.getActiveSheet();
    // The Calendar ID is stored at the top left of the 'Calendar ID' sheet.
    const calendar = CalendarApp.getOwnedCalendarById(sheet.getRange('Calendar ID!A1').getValue());

    console.log("hi there");
    /**
      *  Pull bill event data from the Spreadsheet.
      */
    const [header, ...data] = sheet.getDataRange().getValues();
    Logger.log(JSON.stringify(header));
    Logger.log(JSON.stringify(data));

    const cols = getColumnHeaderIndexes(header);

    /**
       *  Iterate through the billing event records,
       *  creating or deleting calendar events depending on
       *  which callback functions were passed in.
       */
    data.forEach((rowData, i) => {
      const id = rowData[cols.id];
      const deleteEvent = rowData[cols.deleteFlag];
      if (deleteEvent) {
        if (id) {
          clearCalendarEvent(sheet, calendar, i, header, rowData);
        } else {
          Logger.log(`Spreadsheet row ${idx2SSRow(i)} is checked for deletion but no calendar event id was recorded.`);
        }
      } else { // no delete flag in the spreadsheet row
        if (id) {
          refreshCalendarEvent(sheet, calendar, i, header, rowData);
        } else {
          createCalendarEvent(sheet, calendar, i, header, rowData);
        } 
      }
    })
  }

  function createCalendarEvent(sheet, calendar, i, header, rowData) {
    // make getFields helper function?
    const cols = getColumnHeaderIndexes(header);
    const when = rowData[cols.when];
    const payee = rowData[cols.payee];
    const idCell = sheet.getRange(idx2SSRow(i), idx2SSColumn(cols.id), 1, 1);
    const description = buildDescription(header, rowData);
    if (!when || !payee || !description) {
      Logger.log(`Missing information in spreadsheet row ${idx2SSRow(i)}, cannot create calendar event.`)
    } else {
      const event = calendar.createAllDayEvent(payee, when, { description: description });
      Logger.log(`Event ID: ${event.getId()}`);
      const eventID = event.getId();
      idCell.setValue(eventID);
      Logger.log(`Created calendar event spreadsheet row ${idx2SSRow(i)} with event id ${eventID}.`);
    }
  }

  function formatDate(inDate) {
    return inDate.toLocaleDateString('en-us', { weekday:"long", year:"numeric", month:"short", day:"numeric"});
  }

  function buildDescription(header, rowData) {
    const cols = getColumnHeaderIndexes(header);
    const payee = rowData[cols.payee];
    const expectedAmount = USDollar.format(rowData[cols.expectedAmount]);
    const actualAmount = USDollar.format(rowData[cols.actualAmount]);
    const account = rowData[cols.account];
    const scheduledDate = rowData[cols.scheduledDate];
    const paidDate = rowData[cols.paidDate];
    let description;
    if (payee && expectedAmount && account) {
      if (paidDate) {
        description = `Paid ${actualAmount} to ${payee} from ${account} on ${formatDate(paidDate)},`;
      } else if (expectedAmount == 0) {
        description = `${payee} has a zero balance.`;
      } else if (expectedAmount < 0) {
        description = `${payee} has a ${expectedAmount} credit.`;
      } else if (scheduledDate) {
        description = `${expectedAmount} has been scheduled to ${payee} from ${account} on ${formatDate(scheduledDate)}.`;
      } else {
        description = `Pay ${payee} ${expectedAmount} from ${account}.`;
      }
    } else {
      description = "";
    }
    Logger.log(`Built description: "${description}".`);
    return description;
  }
  

  function refreshCalendarEvent(sheet, calendar, i, header, rowData) {
    const cols = getColumnHeaderIndexes(header);
    const id = rowData[cols.id];
    let calendarEvent = calendar.getEventById(id);

    const newTitle = rowData[cols.payee];
    const oldTitle = calendarEvent.getTitle();
    if (newTitle !== oldTitle) {
      calendarEvent = calendarEvent.setTitle(newTitle);
      Logger.log(`Updated calendar event for spreadsheet row ${idx2SSRow(i)} with new title: "${newTitle}".`);
    }

    const newDescription = buildDescription(header, rowData);
    const oldDescription = calendarEvent.getDescription();
    if (newDescription !== oldDescription) {
      calendarEvent = calendarEvent.setDescription(newDescription);
      Logger.log  (`Updated calendar event for spreadsheet row ${idx2SSRow(i)} with new description:"${newDescription}".`);
    }
  }

  function logAlreadyCreated(sheet, calendar, i, header, rowData) {
    const cols = getColumnHeaderIndexes(header);
    const id = rowData[cols.id];
    Logger.log(`Event ${id} was already created for spreadsheet row ${idx2SSRow(i)}.`);
  }

  function logNothingToDo(sheet, calendar, i, header, rowData) {
    Logger.log(`Nothing to do for spreadsheet row ${idx2SSRow(i)}.`);
  }
  
  function clearCalendarEvent(sheet, calendar, i, header, rowData) {
    const cols = getColumnHeaderIndexes(header);
    const id = rowData[cols.id];
    const idCell = sheet.getRange(idx2SSRow(i), idx2SSColumn(cols.id), 1, 1);
    try {
      const event = calendar.getEventById(id);
      Logger.log(`Got event ${id}`);
      try {
        event.deleteEvent();
        Logger.log(`Deleted event ${id}`);
      } catch (error) {
        Logger.log(`Could not find and delete event ${id} for row ${i}.`);
      }
    }
    catch (error) {
      Logger.log(`Could not find and delete event ${id}`);
    }
    idCell.clearContent();
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

function getColumnHeaderIndexes(header) { //header2indices()?
  // Here we have significant coupling with the spreadsheet.
  // If the column names in the spreadsheet change, the changes
  // must be mirrored in this object.
  const cols = {
    id: header.indexOf("Event ID"),
    deleteFlag: header.indexOf("Delete Event"),
    //paidFlag: header.indexOf("Paid"),
    when: header.indexOf('Date Due'),
    payee: header.indexOf('Payee'),
    expectedAmount: header.indexOf('Expected Amount'),
    actualAmount: header.indexOf('Actual Amount'),
    account: header.indexOf('Account'),
    scheduledDate: header.indexOf('Scheduled For'),
    paidDate: header.indexOf('Date Paid')
    //getID: function () {
    //  return this._id;
    //}
  }
  // raise exception if any of these are negative
  return cols;
}

  function idx2SSRow(i) {
    return i + 2;
  }

  function idx2SSColumn(i) {
    return i + 1;
  }