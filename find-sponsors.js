const debugImap = require('debug')('mail:imap');
const addrs = require("email-addresses");
const fs = require('fs-extra');

var imaps = require('imap-simple');
const settings = require('./settings.local.js'); 
var config = {
  imap: {
    user: settings.imap.user,
    password: settings.imap.password,
    host: settings.imap.host,
    port: 993,
    tls: true,
    authTimeout: 3000
  }
};

function summarizeMailbox(connection, box) {
    return connection.openBox(box)
    .then(() => connection.search(['ALL'], {bodies: ['HEADER']}))
    .then(results =>
        results.map(res => {
            const header = res.parts.filter(p => p.which === 'HEADER')[0].body;
            return {
                subject: header.subject[0],
                to: header.to ? header.to[0] : "to who?",
                date: header.date[0],
                from: header.from[0],
                header
            };
        })
    );
}

function mailSummary(boxes) {
    return imaps.connect(config)
    .then(connection => {
        return Promise.all(boxes.map(box => summarizeMailbox(connection, box)))
            .then(lists => [].concat.apply([], lists))
            .then(e => {
                connection.end();
                return e;
            })
    }).catch(err => {
        // eslint-disable-next-line no-console
        console.error(err);
    });    
}


const CUSTOM_DATA_PLUGIN_ID = '56d5e249a98895a9797bebb9';

const {trelloGet} = require('./lib/trello');

function cardsForBoard(boardId) {
    return trelloGet(`1/boards/${boardId}/cards/`, {pluginData: true});
}

function parseCustomFields(card, board) {
    const boardCustomFields = board.pluginData.find(data => data.idPlugin === CUSTOM_DATA_PLUGIN_ID);
    const cardCustomFields = card.pluginData.find(data => data.idPlugin === CUSTOM_DATA_PLUGIN_ID);

    function customFields() {
        const fieldDefs = JSON.parse(boardCustomFields.value).fields;

        const customFields = {};
        const fields = JSON.parse(cardCustomFields.value).fields;
        for (let field in fields) {
            const fieldName = fieldDefs.find(d => d.id === field).n;
            customFields[fieldName] = fields[field];
        }
        return customFields;
    }

    return cardCustomFields ? customFields() : {};
}

function findSponsorsInBoard(idBoard, board) {
    return trelloGet(`1/boards/${idBoard}/lists/`)
        .then(lists => lists.map(list => {return {id: list.id, name: list.name};}))
        .then(lists => {
            return trelloGet(`1/boards/${idBoard}/cards/`, {pluginData: true})
                .then(cards =>
                    mailSummary(['Sent', 'Inbox/Archive']).then(mailSummaries => {
                        return cards.map(card => {
                            const customData = parseCustomFields(card, board);
                            let domain = null;
                            let emails = [];
                            const mainContact = customData["Main contact (Email)"];
                            if (mainContact) {
                                domain = addrs.parseAddressList(mainContact)[0].domain;
                                emails = mailSummaries.filter(summary =>
                                    summary.to.indexOf("@" + domain) != -1 || summary.from.indexOf("@" + domain) != -1
                                );
                            }
        
                            return {
                                id: card.id, name: card.name,
                                list: lists.filter(l => l.id === card.idList)[0].name,
                                board: board.name,
                                customData,
                                domain,
                                emails
                            }  
                    })
                }));
        });
}


function findSponsors(idBoard) {
    return trelloGet(`1/boards/${idBoard}`, {pluginData: true}).then(board => findSponsorsInBoard(idBoard, board));
}

const idBoards = ['58d4fad19f8050e3ef837a11', '565f53acd8080adcd0c1bb37'];

Promise.all(idBoards.map(id => findSponsors(id)))
    .then(lists => [].concat.apply([], lists))
    //.then(sponsors => console.log(JSON.stringify(sponsors)))
    .then(sponsors => fs.writeJson('sponsor-browser/dist/sponsors.json', {sponsors}))
    .catch(err => console.error(err))
    