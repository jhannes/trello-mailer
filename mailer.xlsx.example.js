var XLSX = require('xlsx');

var workbook = XLSX.readFile('example.workbook.xlsx');
var worksheet = workbook.Sheets['Sheet1'];

const recipients = XLSX.utils.sheet_to_json(worksheet).map(row => {
  const first_name = row['First name'].trim(),
    full_name = row['First name'].trim() + ' ' + row['Last name'].trim(),
    email = row['Email address'], company_name = row['Company name'],
    should_send = row['Accepts email'] === 'yes';
  return { first_name, full_name, email, company_name, should_send };
}).filter(r => r.should_send).map(r => {
  return {
    to_recipients: r.full_name + ' <' + r.email + '>',
    recipient_name: r.first_name, company: r.company_name
  };
});

// eslint-disable-next-line no-console
//console.log(recipients.map(p => p.full_name));

const email = require('./lib/email');
const emailTemplate = email.htmlMessage('./email.template.markdown');
//const emailTemplate = email.plainMessage('./email.2016-nonshows.local.markdown');
const saveDraftEmails = email.saveDraftEmails;
//const saveDraftEmails = email.previewFirstEmail;
//const saveDraftEmails = (messages) => email.saveDraftEmails([messages[0]]);

saveDraftEmails(recipients.map(emailTemplate));
