'use strict';

module.exports.execute = execute;
module.exports.isStar = true;

const request = require('request');
const url = 'http://localhost:8080/messages';
const chalk = require('chalk');
const red = chalk.hex('#F00');
const green = chalk.hex('#0F0');

function execute() {
    // Внутри этой функции нужно получить и обработать аргументы командной строки
    const args = process.argv;
    let message = {};
    switch (args[2].toLowerCase()) {
        case 'list': {
            message = parseMessage(args);
            let answer = newRequest(createQuery(message, 'get'), 'get');

            return Promise.resolve(answer);
        }
        case 'send': {
            message = parseMessage(args);
            let requestMessage = newRequest(createQuery(message, 'post'), 'post');

            return Promise.resolve(requestMessage);
        }
        default:
            break;
    }
}

function parseMessage(args) {
    let message = {};
    for (let i = 3; i < args.length; i++) {
        let arg = args[i].match(/[^-].*/);
        if (arg[0].indexOf('=') !== -1) {
            let splitArg = arg[0].split('=');
            message[splitArg[0].toLowerCase()] = splitArg[1];
        } else {
            message[arg[0].toLowerCase()] = args[i + 1];
            i++;
        }
    }

    return message;
}

function createQuery(message, method) {
    if (!message.text && method === 'post') {
        return;
    }
    let urlQuery = url + '?';
    if (message.from) {
        urlQuery += 'from=' + message.from + '&';
    }
    if (message.to) {
        urlQuery += 'to=' + message.to;
    }
    const query = {
        method: method,
        url: urlQuery,
        json: true
    };
    if (method === 'post') {
        query.body = { text: message.text };
    }

    return query;
}

function newRequest(query, method) {

    return new Promise((resolve) => {
        request(query, function (err, res, body) {
            if (err) {

                return resolve(err);
            }

            return resolve(body);
        });
    })
        .then((message) => formRequest(message, method));
}

function formRequest(requestMessage, method) {
    if (method === 'get') {
        let finishGet = '';
        for (let index = 0; index < requestMessage.length - 1; index++) {
            finishGet += formRequest(requestMessage[index], 'post') + '\n\n';
        }
        finishGet += formRequest(requestMessage[requestMessage.length - 1], 'post');

        return finishGet;
    }
    let finish = '';
    if (requestMessage && requestMessage.from) {
        finish += red('FROM') + ': ' + requestMessage.from + '\n';
    }
    if (requestMessage && requestMessage.to) {
        finish += red('TO') + ': ' + requestMessage.to + '\n';
    }
    if (requestMessage && requestMessage.text) {
        finish += green('TEXT') + ': ' + requestMessage.text;
    }

    return finish;
}
