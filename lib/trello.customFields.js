const {trelloGet} = require('./trello');

const customDataPluginId = '56d5e249a98895a9797bebb9';

function getBoardPlugins(idBoard) {
  return trelloGet('1/boards/' + idBoard, {pluginData: true});
}

function decodePluginData(board, idPlugin) {
  const plugin = board.pluginData.find(plugin => plugin.idPlugin === idPlugin);
  return JSON.parse(plugin.value);
}

function listCardsWithCustomData(idList, customDataConfig) {
  return trelloGet('1/lists/' + idList + '/cards').then(cards => {
    return Promise.all(cards.map(c => getCardWithCustomData(c, customDataConfig)));
  });
}

function getCardWithCustomData(card, customDataConfig) {
  function parseCustomFields(cardPluginData) {
    const customFieldsData = cardPluginData
      .find(data => data.idPlugin === customDataPluginId);
    const fields = customFieldsData ? JSON.parse(customFieldsData.value).fields : {};

    const customFields = {};
    Object.keys(fields).forEach(field => {
      const fieldName = customDataConfig.fields.find(f => f.id == field).n;
      customFields[fieldName] = fields[field];
    });
    return customFields;
  }

  function decodeCardWithCustomData(pluginData) {
    return {
      id: card.id,
      labels: card.labels.map(label => label.name),
      name: card.name,
      pluginValues: parseCustomFields(pluginData)
    };
  }

  return trelloGet('1/cards/' + card.id + '/pluginData')
    .then(decodeCardWithCustomData);
}

exports.listCardsFromList = (idList) => {
  return trelloGet('1/lists/' + idList)
    .then(list => getBoardPlugins(list.idBoard))
    .then(board => decodePluginData(board, customDataPluginId))
    .then(customPluginData => listCardsWithCustomData(idList, customPluginData));
};
