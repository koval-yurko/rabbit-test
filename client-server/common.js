const http =  require('http');
const express = require('express');
const process = require('process');

function createServer(port = 4444) {
    const app = express();
    const webServer = http.createServer(app);

    return {
        app,
        webServer,
        start() {
            return new Promise((resolve, reject) => {
                webServer.listen(port, (err) => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve();
                });
            });

        }
    }
}

function getProcessId() {
    return process.pid;
}

function generateUuid() {
    return Math.random().toString() +
        Math.random().toString() +
        Math.random().toString();
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomPort(from = 4000, to = 5000) {
    return getRandomInt(from, to);
}

function delay(time, resolveObj, rejectObj) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (typeof rejectObj !== 'undefined') {
                return reject(rejectObj);
            }
            return resolve(resolveObj);
        }, time);
    });
}

module.exports = {
    createServer,
    getProcessId,
    generateUuid,
    getRandomInt,
    getRandomPort,
    delay,
};
