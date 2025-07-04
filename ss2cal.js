function scheduleBills() {

  Logger = setupLogger();

  /**
   *  Open the Spreadsheet and the Calendar
   */
  const sheet = SpreadsheetApp.getActiveSheet();
  // The Calendar ID is stored at the top left of the 'Calendar ID' sheet.
  const calendar = CalendarApp.getOwnedCalendarById(sheet.getRange('Calendar ID!A1').getValue());

  /**
    *  Pull bill event data from the Spreadsheet.
    */
  const [header, ...data] = sheet.getDataRange().getValues();
  Logger.finer(`Sheet headers are: ${JSON.stringify(header)}`);
  Logger.finest(`Sheet data: ${JSON.stringify(data)}`);

  data.forEach((rowData, i) => {
    const mappedRow = getRowDataMap(sheet, calendar, i, header, rowData);
    if (mappedRow.get("status") === 'DELETE') {
      clearCalendarEvent(mappedRow);
    } else if (mappedRow.get("id")) {
      refreshCalendarEvent(mappedRow);
    } else {
    createCalendarEvent(mappedRow);
    }
  })
}


function clearCalendarEvent(mappedRow) {
  const calendar = mappedRow.get("calendar");
  const sheet  = mappedRow.get("sheet");
  const row = mappedRow.get("row");

  const id = mappedRow.get("id");
  if (!id) {
    Logger.warning(`Cannot delete event: spreadsheet row ${row} has DELETE status but no calendar event id!`);
    return;
  }

  const event = calendar.getEventById(id);
  try {
    event.deleteEvent();
  } catch (error) {
    Logger.warning(`Could not find and delete event ${id} for spreadsheet row ${row}.  Error: ${error.message}`);
    return;
  }
  Logger.info(`Deleted event ${id} from the calendar.`);

  const idColumn = mappedRow.get("idColumn");
  const idCell = sheet.getRange(row, idColumn, 1, 1);
  idCell.clearContent();
  Logger.finer(`Cleared id event ${id} in spreadsheet row ${row}.`);
}


function createCalendarEvent(mappedRow) {

  const sheet = mappedRow.get("sheet");
  const calendar = mappedRow.get("calendar");
  const row = mappedRow.get("row");
  const idColumn = mappedRow.get("idColumn");
  const when = mappedRow.get("when");
  if (!when) {
    Logger.warning(`Missing due date in spreadsheet row ${row}, cannot create calendar event.`)
    return;
  }

  const payee = mappedRow.get("payee");
  const description = buildDescription(mappedRow);

  const event = calendar.createAllDayEvent(payee, when, { description: description });
  const eventID = event.getId();
  Logger.info(`Created calendar event spreadsheet for row ${row} with event id ${eventID}.`);

  const idCell = sheet.getRange(row, idColumn, 1, 1);
  idCell.setValue(eventID);
  Logger.finer(`Stored id event ${eventID} in spreadsheet row ${row}.`);
}


function refreshCalendarEvent(mappedRow) {

  const calendar = mappedRow.get("calendar");
  const row = mappedRow.get("row");
  const id = mappedRow.get('id');
  const calendarEvent = calendar.getEventById(id);

  const newWhen = mappedRow.get("when");
  const oldWhen = calendarEvent.getAllDayStartDate();
  if (newWhen.toDateString() !== oldWhen.toDateString) {
    calendarEvent.setAllDayDate(newWhen);
    Logger.info(`Updated calendar event for spreadsheet row ${row} with new all day date: "${formatDate(newWhen)}".`);
  }

  const newTitle = mappedRow.get("payee");
  const oldTitle = calendarEvent.getTitle();
  if (newTitle !== oldTitle) {
    calendarEvent.setTitle(newTitle);
    Logger.info(`Updated calendar event for spreadsheet row ${mappedRow} with new title: "${newTitle}".`);
  }

  const newDescription = buildDescription(mappedRow);
  const oldDescription = calendarEvent.getDescription();
  if (newDescription !== oldDescription) {
    calendarEvent.setDescription(newDescription);
    Logger.info(`Updated calendar event for spreadsheet row ${row} with new description: "${newDescription}".`);
  }
}


function buildDescription(mappedRow) {

  const status =  mappedRow.get('status');
  const payee = mappedRow.get('payee');
  const amount = mappedRow.get('amount');
  const account = mappedRow.get('account');
  const when = mappedRow.get('when');

  let description;
  switch (status) {
    case 'Pending':
      description = `Pay ${amount} to ${payee} from ${account} by ${formatDate(when)}.`;
      break;
    case 'Scheduled':
      description = `Scheduled ${amount} payment to ${payee} from ${account} on ${formatDate(when)}.`;
      break;
    case 'Auto Pay':
      description = `Auto Pay ${amount} payment to ${payee} from ${account} on ${formatDate(when)}.`;
      break;
    case 'Paid':
      description = `Paid ${amount} payment to ${payee} from ${account} on ${formatDate(when)}.`;
      break;
  }

  Logger.finer(`Built description: "${description}".`);
  return description;
}
