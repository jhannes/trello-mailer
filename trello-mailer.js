/* eslint no-console: 0 */

const program = require('commander');

const email = require('./lib/email');

const {trelloGet} = require('./lib/trello');

function parseDesc(desc) {
    return desc.split(/\n/).filter(s => s.match(/^\*\*.*\*\*: /));
}

function toRecipient(card) {
    const recipient = {id: card.id, company: card.name, name: card.name, labels: card.labels, url: card.url };
    

    for (const statusLine of parseDesc(card.desc)) {
        const tmp = statusLine.match(/^\*\*([^*]+)\*\*: (.*)$/);
        if (tmp) {
            recipient[tmp[1]] = tmp[2];
        }
    }

    recipient.to_recipients = recipient.mainContact;
    recipient.sponsor2016 = recipient['Mobile Era 2016'];
    recipient.sponsor2017 = recipient['Mobile Era 2017'];
    return recipient;
}

program.version('0.1.0');
    
program
    .command('show-organizations')
    .action(() => {
        trelloGet('1/members/me/organizations')
            .then(result => result.map(org => ({id: org.id, name: org.name})))
            .then(console.log);
    });
    
program
    .command('show-boards')
    .option('-o, --organization <organizationId>', 'List all boards for the specified organization')
    .action((options) => {
        trelloGet(`1/organizations/${options.organization}/boards`)
            .then(result => result.map(board => ({id: board.id, name: board.name})))
            .then(console.log);
    });

program
    .command('show-lists')
    .option('-b, --board <boardId>', 'List all lists for the specified board')
    .action((options) => {
        trelloGet(`1/boards/${options.board}/lists`)
            .then(result => result.map(board => ({id: board.id, name: board.name})))
            .then(console.log);
    });

program
    .command('emails')
    .option('-l, --list <listId>', 'Process all the cards on the specified list')
    .option('--label [value]', 'Filter card to labels (can be specified repeatedly)', (v, accu) => accu.concat(v), [])
    .option('-u, --user <username>', 'Filter cards by the specified username')
    .option('--me', 'Filter cards to mine')
    .option('--debug', 'Only list matching cards')
    .option('--preview', 'Only preview emails')
    .option('--verify', 'Verify that emails can be generated')
    .option('--template <filename>', 'Use specified email template')
    .option('--email', 'Save draft emails to IMAP Drafts folder')
    .action((options) => {
        if (!options.list) {
            throw new Error('list required');
        }

        trelloGet(`1/lists/${options.list}/cards`, {members: true})
            .then(cards => {
                if (options.me) {
                    return trelloGet('1/members/me')
                        .then(me => [cards, me.username]);
                }
                return [cards];
            })
            .then(([cards, username]) => {
                if (options.label) {
                    for (const label of options.label) {
                        cards = cards.filter(card => card.labels.map(l => l.name).includes(label));
                    }
                }
                if (username) {
                    cards = cards.filter(card => card.members.map(m => m.username).includes(username));
                } else if (options.user) {
                    cards = cards.filter(card => card.members.map(m => m.username).includes(options.user));
                }

                const recipients = cards
                    .map(toRecipient);
                if (options.debug) {
                    console.log(recipients);
                } else if (options.verify && options.template) {
                    const verifyMessage = email.verifyMessage(options.template);
                    recipients.map(verifyMessage);
                } else if (options.preview && options.template) {
                    const emailTemplate = email.plainMessage(options.template);
                    recipients.map(s => console.log(emailTemplate(s).toString()));
                } else if (options.email && options.template) {
                    const emailTemplate = email.htmlMessage(options.template);
                    email.saveDraftEmails(recipients.map(emailTemplate));
                } else {
                    throw new Error('What to do??');
                }
            }).catch(console.error);
    });

program.parse(process.argv);
