const settings = require('../settings.local.js').trello;
const qs = require('qs');

function maskUrl(url) {
  return url.replace(settings.key, '*****').replace(settings.token, '*****');
}

const axiosDebugConfig = {
  request: function (debug, config) {
    debug(config.method.toUpperCase() + ' ' + maskUrl(config.url));
  },
  response: function (debug, response) {
    debug(
      response.status + ' ' + response.statusText,
      '(' + response.config.method.toUpperCase() + ' ' + maskUrl(response.config.url) + ')'
    );
  }
};
require('axios-debug-log')(axiosDebugConfig);
//require('axios-debug-log');

const axios = require('axios');

function trelloUrl(path, object={}) {
  if (!settings.key) {
    throw new Error('Specify trello.key in settings.local.js');
  }
  object.key = settings.key;
  object.token = settings.token;
  return 'https://api.trello.com/' + path + '?' + qs.stringify(object);
}

function trelloGet(path, object={}) {
  return axios.get(trelloUrl(path, object), {responseType: 'json'}).then(res => res.data);
}

function trelloPost(path, object={}) {
  return axios.post(trelloUrl(path, object));
}

function trelloPut(path, object={}) {
  return axios.put(trelloUrl(path, object));
}

exports.trelloGet = trelloGet;
exports.trelloPost = trelloPost;
exports.trelloPut = trelloPut;
