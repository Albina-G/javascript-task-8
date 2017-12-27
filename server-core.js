'use strict';

const http = require('http');
const url = require('url');
const uniqid = require('uniqid');

const server = http.createServer();
let allMessages = [];

server.on('request', (req, res) => {
    let parseUrl = url.parse(req.url, true);
    if (checkUrlMethod(parseUrl, req)) {
        res.setHeader('Content-Type', 'application/json');
        methodDefinition(res, req, parseUrl);
    } else {
        errorReturn(res);
    }
});

module.exports = server;

function checkUrlMethod(parseUrl, req) {
    if (req.method === 'GET' || req.method === 'POST') {

        return /^\/messages$/.test(parseUrl.pathname);
    }

    return /^\/messages\/[\w-_]+$/.test(parseUrl.pathname);
}

function methodDefinition(res, req, parseUrl) {
    switch (req.method) {
        case 'GET':
            res.end(getMessages(parseUrl.query));
            break;
        case 'POST':
            readRequest(req)
                .then(textMessage => returnMessage(parseUrl, textMessage, res, addNewMessage));
            break;
        case 'DELETE':
            res.end(createAnswerDelete(parseUrl, res));
            break;
        case 'PATCH':
            readRequest(req)
                .then(textMessage => returnMessage(parseUrl, textMessage, res, findAndEditMessage));
            break;
        default:
            errorReturn(res);
            break;
    }
}

function addNewMessage(query, text, res) {
    if (!text || text === '') {
        errorReturn(res);
    }
    let id = uniqid.process();
    let answer = {
        id: id,
        from: query.from || undefined,
        to: query.to || undefined,
        text: text
    };
    allMessages.push(answer);

    return answer;
}

function getMessages(query) {
    if (query.from === undefined && query.to === undefined) {

        return JSON.stringify(allMessages);
    }

    return JSON.stringify(allMessages.filter((message) => {
        if (query.from === undefined) {

            return message.to === query.to;
        }
        if (query.to === undefined) {

            return message.from === query.from;
        }

        return message.from === query.from && message.to === query.to;
    }));
}

function errorReturn(res) {
    res.statusCode = 404;
    res.end();
}

function createAnswerDelete(parseUrl, res) {
    let id = parseUrl.pathname.split('/')[2];
    if (!id) {
        errorReturn(res);
    }
    allMessages = allMessages.filter(message => {

        return message.id !== id;
    });

    return JSON.stringify({ 'status': 'ok' });
}

function findAndEditMessage(parseUrl, text, res) {
    let id = parseUrl.pathname.split('/')[2];
    if (!id || !text) {
        errorReturn(res);
    }
    let indexEditMsg;
    allMessages.forEach((message, index) => {
        if (message.id === id) {
            indexEditMsg = index;
            message.text = text;
            message.edited = true;
        }
    });

    return allMessages[indexEditMsg] || {};
}

function readRequest(req) {

    return new Promise(resolve => {
        let textMessage = '';
        req.on('readable', () => {
            let reqRead = req.read();
            if (reqRead !== null) {
                textMessage += reqRead;
                resolve(textMessage);
            }
        });
    });
}

function returnMessage(parseUrl, textMessage, res, funcCreateMsg) {
    textMessage = JSON.parse(textMessage);
    textMessage = funcCreateMsg(parseUrl.query, textMessage.text, res);
    res.end(JSON.stringify(textMessage));
}
