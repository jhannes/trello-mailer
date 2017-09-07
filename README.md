trello-mailer decodes the cards in one or more Trello
lists, generates an email for each card and saves
the email as a draft on your IMAP mail account.

Usage:
------

_Files ending with `.local.js` are in `.gitignore`. Put your local settings here._

1. Add the Power-Up "Custom Fields" in Trello and ad the fields you
   to use for the mail merge to the cards
2. Create your email by using `email.template.markdown` as a template
3. Create a `mailer.local.js` based on `mailer.template.js`
   * Update the idLists property to the id of your trello list
     (in the future, I'll help you find these!)
   * Update the `cardToContacts` function to map the fields
     on your trello cards as you want them in your template
   * If you want to preview your email, uncomment the line
     `saveDraftEmails = email.previewFirstEmail`
4. In order to see better what's going on, it's smart to set
   the enviroment variable `set DEBUG=axios,mail:imap`
5. Create `settings.local.js` from `settings.template.js`
   with your IMAP and Trello credentals
6. Run `node mailer.local.js`
7. Open your email client and see the messages in your drafts folder
8. You may now tweak your messages if you want and send them at will



