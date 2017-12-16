'use strict';

const request = require('request');
const chalk = require('chalk');
const red = chalk.hex('#F00');
const green = chalk.hex('#0F0');
const url = 'http://localhost:8080/messages';

module.exports.execute = execute;
module.exports.isStar = true;

function execute() {
    // Внутри этой функции нужно получить и обработать аргументы командной строки
    const args = process.argv;
    switch (args[2].toLowerCase()) {
        case 'list': {
            let message = parseMessage(args);
            let answer = createQuery(message, 'GET');

            return Promise.resolve(answer);
        }
        case 'send': {
            let message = parseMessage(args);
            let requestMessage = createQuery(message, 'POST');

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
        if (arg[0].includes('=')) {
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
    if (!message.text && method === 'POST') {
        throw new Error('Отсутствует текст сообщения');
    }
    const query = {
        method: method,
        url: createUrl(message),
        json: true
    };
    if (method === 'POST') {
        query.body = { text: message.text };

        return newRequest(query);
    }

    return newRequest(query, isGet);
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

function newRequest(query, responseProcessing = formRequest) {

    return new Promise((resolve, reject) => {
        request(query, function (err, res, body) {
            if (err) {

                return reject(err);
            }

            return resolve(body);
        });
    })
        .then((message) => responseProcessing(message));
}

function formRequest(requestMessage) {
    let finish = '';
    if (requestMessage && requestMessage.from) {
        finish += `${red('FROM')}: ${requestMessage.from}\n`;
    }
    if (requestMessage && requestMessage.to) {
        finish += `${red('TO')}: ${requestMessage.to}\n`;
    }
    if (requestMessage && requestMessage.text) {
        finish += `${green('TEXT')}: ${requestMessage.text}`;
    }

    return finish;
}

function isGet(requestMessage) {
    let finishGet = '';
    for (let index = 0; index < requestMessage.length - 1; index++) {
        finishGet += `${formRequest(requestMessage[index])}\n\n`;
    }
    finishGet += formRequest(requestMessage[requestMessage.length - 1]);

    return finishGet;
}
