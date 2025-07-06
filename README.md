# SS2Cal

This is an [Apps Script](https://developers.google.com/apps-script) for a Google Sheets worksheet that reflects events from a spreadsheet to a Google calendar.

A family or other financial unit can share the spreadsheet and the calendar in order to better coordinate paying and planning to pay bills.  They enter planned expenses in the spreadsheet, run their version of the Apps Script supplied here, and then can see the billing events on their shared calendar.

This is a one-way process, spreadsheet to calendar.  If you change the events directly in the calendar, they will not be reflected back into the spreadsheet.

## **Spreadsheet Workbook**

You need a Google [account](https://myaccount.google.com/).  We provide a [sample](https://docs.google.com/spreadsheets/d/1nKjA5P2QAsk2EuUOjVUG0KebP090dx6ItzAcRBsboVA/edit?usp=sharing) Google spreadsheet workbook.  Open it in a browser, and make a copy.

![image][img1]

Change the name of your copy to something appropriate.

![image][img2]

Your workbook starts with two tabbed sheets, labelled _Bill Events_, _Calendar ID_, and a third, labelled _Log_, is added when the Apps Script first runs.

![image][img3]

### Bill Events Sheet

This tabbed sheet can be renamed without effect on the Apps Script but it must be the _first_ tabbed sheet.

Columns can be arranged in any order but their names are used in the Apps Script.  If you rename a column used by the Apps Script, be sure the names in the spreadsheet and the Apps Script match.

#### Event ID Column

Set up as a protected range, this column is for use only by the Apps Script.  It holds the Google Calendar event id for the calendar event corresponding to this row in the spreadsheet.  It is filled by the Apps Script when the calendar event is created, persists if the calendar event is modified by the Apps Script, and is removed if the event is deleted by the Apps Script.

#### Status Column

This column is set up as a dropdown of enumerated values.  For the most part, these values are known only to the _buildDescription_ function in the Apps Script, which produces the description that appears in the corresponding calendar event.

``` JavaScript

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
```

You can easily modify these values in the spreadsheet dropdown for your own use cases if you modify this function accordingly.

A special value DELETE, on the other hand, is used when you want to remove the calendar event altogether for the corresponding spreadsheet row.

``` JavaScript
if (mappedRow.get("status") === 'DELETE') {
      clearCalendarEvent(mappedRow);
} 
```

When this status is encountered, the Apps Script removes the corresponding calendar event and blanks out the calendar id in the relevant spreadsheet row.  It does not itself delete the spreadsheet row but you may of course do that yourself.

#### Date Column

This the date a bill is due, scheduled, or paid.  The Apps Script creates an all-day calendar event on this date and the date is used in the description stored for display with this calendar event.

If the date is left blank, no calendar event corresponding to the spreadsheet row is created.

#### Payee Column

Who gets the payment.  This field is used in the calendar event description and also as the _Title_ of the calendar event.  In the example spreadsheet this field is free text but you could make it a dropdown of enumerated values if you want.

#### Account Column

Which account the payment is drawn from.  This field is used only in the calendar event description.  In the example spreadsheet it is an enumerated dropdown but you can change it to free text if you want.

#### Amount Column

How much money the payment is for.  This field is used only in the calendar event description.

#### Website Column

The Payee's website, handy for checking due dates, amounts, paid statusm, ... Not used by the Apps Script, you can delete this column if you don't find it useful,

#### Notes Column

Just for your own use, the Apps Script does not use this field and you can delete this column if you don't find it useful.

### Calendar ID Sheet

This tabbed sheet holds the unique identifier of your shared billing events calendar.

[Create](https://support.google.com/calendar/answer/37095?hl=en) a calendar for population from the _Billing Events_ sheet and [share](https://support.google.com/calendar/answer/37082?sjid=8893376893026710830-NA) it with your collaborators.  Here is a publicly shared [sample calendar](https://calendar.google.com/calendar/u/0?cid=MmNjNGJhODk4MDQ3NDQxZjkzNjUyYmUyZDM4NWUxYzRmYzc5ZmY3YjkyYmMzOGY2NWExY2NiOGZlODUxYjAyZEBncm91cC5jYWxlbmRhci5nb29nbGUuY29t).

Open your calendar, navigate to Settings, then to _Integrate Calendar_.

![image][img4]

Copy the _Calendar ID_ and paste it into the top left cell (A1) of the tabbed sheet labelled _Calendar ID_.

![image][img5]

Apps Script linkage to this calendar is via this cell in this tabbed sheet.

![image][img6]

### Logs Sheet

The Apps Script logs informational and diagnostic messages, which are invisible from the spreadsheet itself.  We use [BetterLog](https://github.com/peterherrmann/BetterLog) to persist these to the spreadsheet itself under a tab labelled _Logs_.  This tabbed sheet gets created on the first run of the spreadsheet as described [below]](#installation-procedure).

You can switch to default (or other) console logging and/or change the logging level by modifying the setupLogger function:

![image][img7]

## Installation and Operation

### Apps Script installation

After creating and sharging a calendar and recording its ID in the _Calendar ID_ tabbed sheet as described [above](#calendar-id-sheet), select _Apps Script_ from the _Extensions_ menu in the spreadsheet.

![image][img8]

You will see a list of files on the left side.

![image][img9]

_ss2cal.gs_ starts with the entry point function _scheduleBills()_ and contains the other high level functions for the Apps Script.  _helpers.gs_ contains various helper functions, including _onOpen()_,

![image][img10]

which adds a trigger to the Apps Script from the spreadsheet user interface.

![image][img11]

These two files are kept under version control in this github repository and the versions you get by copying the sample calendar maybe behind the latest on github.  For this simple project you can simply copy them from the repository on top of their counterparts in the Apps Script file editor.
(Note that the normal javascript _.js_ extension is replaced with _.gs_.). Or you could use [clasp](https://developers.google.com/apps-script/guides/clasp) to upload these files from your local clone of the github repository.

### First run from Apps Script editor

#### Setup Logging to the right spreadsheet

Get your spreadsheet ID by inspection of its url:

![image][img12]

and, using the Apps Script editor, put it between the single quotes in the _setupLogger()_ function:

![image][img13]

Adjust the Log level to your liking.

#### Run Apps Script from Apps Script editor

From the AppScript editor, with _ss2cal.gs_ selected from the list of files on the left and the _scheduleBills_ function selected from the dropdown menu at the top, click the _Run_ button.

![image][img14]

For this first run only, you will be prompted to login to Google [authorize](https://developers.google.com/apps-script/guides/services/authorization) your script to access and modify your spreadsheet. After authorization, the script runs and the _Execution Log_ appears in the Apps Script editor window as well as in a new tabbed sheet labelled _Logs_ in your workbook.

The _Event ID_ columnn in the _Bill Events_ tabbed sheet in your workbook is now populated with calendar event IDs newly created events.  You can inspect the corresponding google calendar for these events and observe that they have been created on dates and with titles and descriptions matching the information provided in the corresponding spreadsheet row.

### Scheduling, updating, and deleting calendar events from the spreadsheet

After this [first run](#first-run-from-Apps Script-editor), the spreadsheet UI is modified to enable you to run the AppScript directly without any need to open up the editor.  As mentioned, logs are recorded in their own tabbed sheet in the workbook.

## How to report bugs

Please open an [issue](https://github.com/tombarron/ss2cal/issues) on GitHub.

[img1]: ./img/copySample.png

[img2]: ./img/makeCopyDialogue.png

[img3]: ./img/sample.png

[img4]: ./img/integrateCalendar.png

[img5]: ./img/calendarID.png

[img6]: ./img/fetchCalendarID.png

[img7]: ./img/setupLogger.png

[img8]: ./img/selectAppscript.png

[img9]: ./img/appScriptFiles.png

[img10]: ./img/onOpen.png

[img11]: ./img/appScriptTrigger.png

[img12]: ./img/getSpreadsheetID.png

[img13]: ./img/setupLogger.png

[img14]: ./img/runFromAppScriptEditor.png
