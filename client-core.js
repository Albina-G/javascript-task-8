'use strict';

const request = require('request');
const chalk = require('chalk');
const minimist = require('minimist');

const red = chalk.hex('#F00');
const green = chalk.hex('#0F0');
const grey = chalk.hex('#777');
const yellow = chalk.hex('#FF0');
const url = 'http://localhost:8080/messages';

module.exports.execute = execute;
module.exports.isStar = true;

function execute() {
    // Внутри этой функции нужно получить и обработать аргументы командной строки
    const args = minimist(process.argv.slice(2));
    let formatMsg;
    switch (args._[0].toLowerCase()) {
        case 'list': {
            let answer = createQuery(args, 'GET');
            formatMsg = answer.then(message => isGet(message, args.v));

            return Promise.resolve(formatMsg);
        }
        case 'send': {
            let requestMessage = createQuery(args, 'POST');
            formatMsg = requestMessage.then(message => formatRequest(message, args.v));

            return Promise.resolve(formatMsg);
        }
        case 'delete': {
            let deleteMSG = deleteMessage(args);

            return Promise.resolve(deleteMSG);
        }
        case 'edit': {
            let editeMSG = editMessage(args);
            formatMsg = editeMSG.then(message => formatRequest(message));

            return Promise.resolve(formatMsg);
        }
        default:
            break;
    }
}

function createQuery(message, method) {
    if (!message.text && method === 'POST') {

        return;
    }
    const query = {
        method: method,
        url: createUrl(message),
        json: true
    };
    if (method === 'POST') {
        query.body = { text: message.text };
    }

    return newRequest(query);
}

function createUrl(message) {
    let urlQuery = url;
    if (message.from || message.to) {
        urlQuery += '?';
    }
    if (message.from && message.to) {
        urlQuery += `from=${message.from}&`;
    }
    if (message.from && !message.to) {
        urlQuery += `from=${message.from}`;
    }
    if (message.to) {
        urlQuery += `to=${message.to}`;
    }

    return urlQuery;
}

function deleteMessage(args) {
    if (args.id) {

        return;
    }
    let urlQuery = `${url}/${args.id}`;
    const query = {
        method: 'DELETE',
        url: urlQuery,
        json: true
    };

    let answer = newRequest(query);
    if (answer.status === 'ok') {

        return 'DELETED';
    }

    return answer;
}

function editMessage(args) {
    if (args.id || args.text) {

        return Promise.resolve(JSON.stringify({}));
    }
    let urlQuery = `${url}/${args.id}`;
    const query = {
        method: 'PATCH',
        url: urlQuery,
        json: true,
        body: { text: args.text }
    };

    return newRequest(query);
}

function newRequest(query) {

    return new Promise((resolve, reject) => {
        request(query, function (err, res, body) {
            if (err) {

                return reject(err);
            }

            return resolve(body);
        });
    });
}

function formatRequest(requestMessage, key) {
    let finish = '';
    if (key) {
        finish += `${yellow('ID')}: ${requestMessage.id}\n`;
    }
    if (requestMessage.from) {
        finish += `${red('FROM')}: ${requestMessage.from}\n`;
    }
    if (requestMessage.to) {
        finish += `${red('TO')}: ${requestMessage.to}\n`;
    }
    finish += `${green('TEXT')}: ${requestMessage.text}`;
    if (requestMessage.edited) {
        finish += grey('(edited)');
    }

    return finish;
}

function isGet(requestMessage, key) {

    return requestMessage.map(message => {

        return formatRequest(message, key);
    })
        .join('\n\n');
}
