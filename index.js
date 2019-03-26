const path = require('path');
const http =  require('http');
const express = require('express');
const socketIo = require('socket.io');
const amqp = require('amqplib');

const { SocketClient } = require('./SocketClient');

const demoPath = path.join(__dirname, './client');
const socketNamespace = 'jaqlcsveditor';

const app = express();
app.use('/', express.static(demoPath));
const webServer = http.createServer(app);
const socketServer = socketIo(webServer, { path: '/gateway' });

socketServer.of(socketNamespace).on('connect', socket => new SocketClient(socket));

webServer.listen('4444', () => {
    console.log('Listening localhost:4444');
});



// const url = 'amqp://127.0.0.1:5676';
//
// function generateUuid() {
//     return Math.random().toString() +
//         Math.random().toString() +
//         Math.random().toString();
// }
//
// amqp.connect(url).then(function(conn) {
//     console.log('connection success');
//     return conn.createChannel()
//         .then(function(ch) {
//             console.log('chanel success');
//             return Promise.all([
//                 // ch.assertQueue('test-reply'),
//                 // ch.assertQueue('foo'),
//                 // ch.assertExchange('bar'),
//                 // ch.bindQueue('foo', 'bar', 'baz'),
//                 ch.consume('test-reply', (msg) => {
//                     ch.ack(msg);
//                     console.log('Message:');
//                     console.log(msg.content.toString());
//                 }),
//                 ch.sendToQueue('test', new Buffer(JSON.stringify({a: 10})),  {
//                     correlationId: generateUuid(),
//                     replyTo: 'test-reply'
//                 }),
//             ]);
//         });
// }).then(null, console.warn);