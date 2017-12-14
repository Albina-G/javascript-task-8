'use strict';

const http = require('http');
const url = require('url');

const server = http.createServer();
let allMessages = [];

server.on('request', (req, res) => {
    let parseUrl = url.parse(req.url, true);
    if (/^\/messages$/.test(parseUrl.pathname)) {
        let textMessage = '';
        switch (req.method) {
            case 'GET':
                res.end(createAnswerGet(parseUrl.query));
                break;
            case 'POST':
                req.on('readable', () => {
                    let reqRead = req.read();
                    if (reqRead !== null) {
                        textMessage += reqRead;
                    }
                });
                req.on('end', () => {
                    textMessage = JSON.parse(textMessage);
                    textMessage = createAnswerPost(parseUrl.query, textMessage.text);
                    res.end(JSON.stringify(textMessage));
                });
                break;
            default:
                res.statusCode = 404;
                res.end();
                break;
        }
    } else {
        res.statusCode = 404;
        res.end();
    }
});

module.exports = server;

function createAnswerPost(query, text) {
    let answer = {};
    Object.keys(query).forEach(key => {
        answer[key] = query[key];
    });
    answer.text = text;
    allMessages.push(answer);

    return answer;
}

function createAnswerGet(query) {
    if (!query.from && !query.to) {
        return JSON.stringify(allMessages);
    }

    return JSON.stringify(allMessages.filter(message => {
        if (!query.from) {

            return message.to === query.to;
        }
        if (!query.to) {

            return message.from === query.from;
        }

        return message.from === query.from && message.to === query.to;
    }));
}