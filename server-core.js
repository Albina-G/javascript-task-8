'use strict';

const http = require('http');
const url = require('url');

const server = http.createServer();
let allMessages = [];

server.on('request', (req, res) => {
    let parseUrl = url.parse(req.url, true);
    if (/^\/messages$/.test(parseUrl.pathname)) {
        res.setHeader('Content-Type', 'application/json');
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
                })
                    .on('end', () => {
                        textMessage = JSON.parse(textMessage);
                        if (textMessage.text === undefined || textMessage.text === '') {
                            res.statusCode = 404;
                            res.end();
                        }
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
    let answer = {
        from: query.from || undefined,
        to: query.to || undefined,
        text: text
    };
    allMessages.push(answer);

    return answer;
}

function createAnswerGet(query) {
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
