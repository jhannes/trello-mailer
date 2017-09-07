const debugImap = require('debug')('mail:imap');

const fs = require('fs');
const yaml = require('js-yaml');
const Mustache = require('mustache');
const markdown = require( 'markdown' ).markdown;
const juice = require('juice');

const mimemessage = require('mimemessage');
const mime = {
  message: (contentType, data, headers) => {
    const msg = mimemessage.factory(Object.assign({}, data, {contentType}));
    if (headers) {
      Object.keys(headers).forEach(header => {
        msg.header(header, headers[header]);
      });
    }
    return msg;
  },
  mixed: (parts, headers = null) => {
    return mime.message('multipart/mixed', {body: parts}, headers);
  },
  alternate: (parts, headers = null) => {
    return mime.message('multipart/alternate', {body: parts}, headers);
  },
  plain: (text, headers = null) => {
    return mime.message(null, {body: text}, headers);
  },
  html: (html, headers = null) => {
    return mime.message('text/html;charset=utf-8', {body: html}, headers);
  },
  file: (filename, contentType, headers) => {
    return mime.message(contentType, {
      contentTransferEncoding: 'base64',
      body: new Buffer(fs.readFileSync(filename)).toString('base64')
    }, headers);
  }
};

function parseTemplate(templateFile) {
  const lines = fs.readFileSync(templateFile).toString().split(/\r?\n/);

  const headerStarts = lines.findIndex(line => line.indexOf('---') === 0);
  const headerEnds = lines.indexOf('---', headerStarts+1);
  const headerText = lines.slice(headerStarts+1,headerEnds).join('\n');

  const bodyStarts = headerEnds;
  const bodyEnds = lines.indexOf('---', bodyStarts+1);
  const bodyText = lines.slice(bodyStarts+1,bodyEnds).join('\n');

  const cssStarts = bodyEnds;
  const cssEnds = lines.indexOf('---', cssStarts+1);
  const cssText = lines.slice(cssStarts+1,cssEnds).join('\n');

  return {
    header: yaml.safeLoad(headerText),
    text: bodyText,
    css: cssText
  };  
}

function renderHeader(template, data) {
  return { 
    To: Mustache.render(template.header.to, data),
    Cc: Mustache.render(template.header.cc, data),
    Subject: Mustache.render(template.header.subject, data),
    'X-Message-Ref': Mustache.render(template.header.messageRef, data)
  };
}

exports.plainMessage = function plainMessage(templateFile) {
  const template = parseTemplate(templateFile);
  return (data) => {
    const plainText = Mustache.render(template.text, data);
    return mime.plain(plainText, renderHeader(template, data));
  };
};

exports.htmlMessage = function htmlMessage(templateFile) {
  const template = parseTemplate(templateFile);
  return (data) => {
    let html = markdown.toHTML(Mustache.render(template.text, data));
    const plainText = Mustache.render(template.text, data);
    let attachments = [];
    if (template.header.attachments) {
      attachments = template.header.attachments.map(attachment =>
        // TODO: derive content type from extension
        mime.file(attachment, 'image/png', { 'Content-ID': attachment })
      );
    }
    if (template.css) {
      html = juice.inlineContent(html, template.css);
    }
    const htmlMessage = mime.mixed([
      mime.alternate([
        mime.html(html),
        mime.plain(plainText)
      ])
    ].concat(attachments), renderHeader(template, data));
    return htmlMessage;
  };
};

exports.previewFirstEmail = function previewFirstEmail(messages) {
  // eslint-disable-next-line no-console
  console.log(messages[0].toString());
};

var imaps = require('imap-simple');
const settings = require('../settings.local.js'); 
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

exports.saveDraftEmails = function saveDraftEmails(messages) {
  debugImap('saving %d messages', messages.length);
  debugImap('connecting to %s@%s', config.imap.host, config.imap.user);
  imaps.connect(config).then(connection => {
    debugImap('connected');
    messages.forEach(message => {
      debugImap('saving draft to %s: %s', message.header('To'), message.header('Subject'));
      connection.append(message.toString(), {mailbox: 'Drafts', flags: '\\Draft'});
    });
    debugImap('disconnecting from %s@%s', config.imap.host, config.imap.user);
    connection.end();
  }).catch(err => {
    // TODO: This wouldn't be needed if imap-simple used modern Promises
    // eslint-disable-next-line no-console
    console.error(err);
  });
};
