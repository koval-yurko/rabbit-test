const express = require('express');
const axios = require('axios');

// define constants
const LOCALHOST = 'http://127.0.0.1';
const WINDOWS_PLATFORM = 'win32';

// define socket channels
const inputChannels = { POST_REQUEST: 'demo/POST_REQUEST' };
const outputChannels = { POST_REQUEST_RESPONSE: 'demo/POST_REQUEST_RESPONSE' };

// define socket client
class SocketClient {
    constructor(socket) {
        this.socket = socket;
        this.cookie = socket.handshake.headers.cookie;
        this.initChannels();
    }

    initChannels() {
        this.socket.on(inputChannels.POST_REQUEST, this.handlePostRequest.bind(this));
    }

    async handlePostRequest({ url, payload }) {
        // make request
        let stream;
        try {
            stream = await this.sendFormDataRequest({
                url,
                payload,
                responseType: 'stream'
            });
        } catch (e) {
            return this.sendPostRequestResponse({
                error: `Occurs an error during posting request: ${e.message}`,
                isDone: true
            })
        }

        // handle response
        stream.data.on('data', (data) => {
            this.sendPostRequestResponse({ chunk: data.toString(), isDone: false })
        });
        stream.data.on('end', () => this.sendPostRequestResponse({ isDone: true }));
    }

    sendPostRequestResponse({ chunk, error, isDone }) {
        this.socket.emit(outputChannels.POST_REQUEST_RESPONSE, { chunk, error, isDone });
    }

    sendFormDataRequest({ url = '', payload, responseType }) {
        const [ basePath, query ] = url.split('?');
        return axios({
            url: basePath,
            responseType,
            method: 'post',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                cookie: this.cookie
            },
            data: `data=${encodeURIComponent(payload)}&${query}`
        })
    }
}

module.exports = { SocketClient };
