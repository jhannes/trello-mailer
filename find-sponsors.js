const debugImap = require('debug')('mail:imap');

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

function searchEmails() {
    imaps.connect(config).then(connection => {
        return connection.openBox('Sent').then(() => {
            return connection.search(['ALL'], {bodies: ['HEADER']}).then(results => {
                const subjects = results.map(res => {
                    const header = res.parts.filter(p => p.which === 'HEADER')[0].body;
                    return {
                        subject: header.subject[0],
                        to: header.to ? header.to[0] : "to who?"
                    };
                });
                console.log(subjects);
                connection.end();
            });
        }).catch(err => {
            connection.end();
            // eslint-disable-next-line no-console
            console.error(err);
        });
    }).catch(err => {
        // TODO: This wouldn't be needed if imap-simple used modern Promises
        // eslint-disable-next-line no-console
        console.error(err);
    });    
}

/*
const idLists = ['58d4fad19f8050e3ef837a11', '565f53acd8080adcd0c1bb37'];

const {listCardsFromList} = require('./lib/trello.customFields.js');
Promise.all(idLists.map(listCardsFromList))
    .then(console.log);
*/

const CUSTOM_DATA_PLUGIN_ID = '56d5e249a98895a9797bebb9';


const {trelloGet} = require('./lib/trello');

function cardsForBoard(boardId) {
    return trelloGet(`1/boards/${boardId}/cards/`, {pluginData: true});
}

function parsePluginData(card, board) {
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

function findCardsInBoard(idBoard, board) {
    return trelloGet(`1/boards/${idBoard}/lists/`)
        .then(lists => lists.map(list => {return {id: list.id, name: list.name};}))
        .then(lists => {
            return trelloGet(`1/boards/${idBoard}/cards/`, {pluginData: true})
                .then(cards => cards.map(card => {
                    return {
                        id: card.id, name: card.name,
                        list: lists.filter(l => l.id === card.idList)[0].name,
                        board: board.name,
                        pluginData: parsePluginData(card, board)
                    }
                }));
        });
}

function findAllCards(idBoard) {
    return trelloGet(`1/boards/${idBoard}`, {pluginData: true}).then(board => findCardsInBoard(idBoard, board))
}




const idBoards = ['58d4fad19f8050e3ef837a11', '565f53acd8080adcd0c1bb37'];
//const idBoards = ['565f53acd8080adcd0c1bb37'];

Promise.all(idBoards.map(id => findAllCards(id)))
    .then(list => {
        list.forEach(cards => {
            cards.forEach(card => console.log(`"${card.name.toLowerCase()}": [ "${(card.pluginData["Main contact (Email)"] || "")}" ]`))
        });
    })

/*
Promise.all(idBoards.map(cardsForBoard))
    .then(all => {
        all.forEach(result =>
            //{ result.map(res => console.log({name:res.name, list: res.idList, board: res.idBoard})); }
            { result.map(res => console.log(res)); }
        );
    });

trelloGet('1/organizations/mobileera2016/boards/')
    .then(boards => boards.map(board => { return {id: board.id, name: board.name};}))
    .then(console.log)
.catch(console.error);
*/


