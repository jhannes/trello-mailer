const {listCardsFromList} = require('./lib/trello.customFields.js');

function flatMap(lists) {
  return [].concat.apply([], lists);
}

const email = require('./lib/email');
// You can format emails in HTML or as plain text
//const emailTemplate = email.plainMessage('./email.template.local.markdown');
const emailTemplate = email.htmlMessage('./email.template.local.markdown');

// Use previewFirstEmail to print the email to console or 
//const saveDraftEmails = email.previewFirstEmail;
//const saveDraftEmails = (messages) => email.saveDraftEmails([messages[0]]);
const saveDraftEmails = email.saveDraftEmails;

// Create a mapping function to transform the card to the format expected by your mail template
function cardToContact(card) {
  return {
    company: card.name,
    recipient_name: card.pluginValues['Contact greeting'],
    to_recipients: card.pluginValues['Main contact (Email)'],
    cc_recipients: card.pluginValues['Secondary contact (email)'],
    idCard: card.id
  };
}

function displayError(err) {
  // eslint-disable-next-line no-console
  console.error(err);
}

// Put the ids of the lists with the cards from Trello here
const idLists = ['your-list-id-here'];

Promise.all(idLists.map(listCardsFromList))
  .then(flatMap)
  .then(cards => cards.map(cardToContact))
  .then(sponsors => sponsors.map(emailTemplate))
  .then(saveDraftEmails)
  .catch(displayError);
