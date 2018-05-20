/* eslint no-console: 0 */

const program = require('commander');

const {trelloGet} = require('./lib/trello');


program.version('0.1.0');
    
program
    .command('show-organizations')
    .action(() => {
        trelloGet('1/members/me/organizations')
            .then(result => result.map(org => ({id: org.id, name: org.name})))
            .then(console.log);
    });
    
program
    .command('show-boards [organizationId]')
    .description('List the boards belonging to an organization')
    .action((organization) => {
        if (!organization) {
            return program.outputHelp();
        }
        trelloGet(`1/organizations/${organization}/boards`)
            .then(result => result.map(board => ({id: board.id, name: board.name})))
            .then(console.log)
            .catch(console.error);
    });

program
    .command('show-lists [boardId]')
    .description('List all lists for the specified board')
    .action((boardId) => {
        trelloGet(`1/boards/${boardId}/lists`)
            .then(result => result.map(board => ({id: board.id, name: board.name})))
            .then(console.log)
            .catch(console.error);
    });

program
    .command('cards [listId]')
    .option('--label [value]', 'Filter card to labels (can be specified repeatedly)', (v, accu) => accu.concat(v), [])
    .option('-u, --user <username>', 'Filter cards by the specified username')
    .option('--me', 'Filter cards to mine')
    .description('List out all the cards in the specified lists (one card per line)')
    .action((listId, options) => {

        trelloGet(`1/lists/${listId}/cards`, {members: true})
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

                for (const card of cards.map(c => c.name)) {
                    console.log(card);
                }
            }).catch(console.error);
    });

program
    .command('*')
    .action(() => {
        console.log("Hello!");
        return program.outputHelp();
    });

program.parse(process.argv);
