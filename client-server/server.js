const amqp = require('amqplib');
const { rabbitUrl } = require('./constants');
const {
    createServer,
    getProcessId,
    getRandomPort,
    delay,
} = require('./common');

const processId = getProcessId();
const serverPort = getRandomPort();
let messageId = 1;

function initServer() {
    const { app, start } = createServer(serverPort);

    return start()
        .then(() => {
            console.log(`[${processId}] server start on "${serverPort}"`);
        })
        .then(() => (app));
}

function sendMessage(ch, queue = 'test') {
    return Promise.resolve()
        .then(() => {
            const id = messageId++;
            console.log(`[${processId}] send message "${id}" to "${queue}" queue`);
            ch.sendToQueue(queue, new Buffer(JSON.stringify({ id })),  {
                // correlationId: generateUuid(),
                // replyTo: 'test-reply'б
                // expiration: 1000,
            })
        })
}

function publishMessage(ch, exchange = 'logs') {
    return Promise.resolve()
        .then(() => {
            const id = messageId++;
            console.log(`[${processId}] send message "${id}" to "${exchange}" exchange`);
            ch.publish(exchange, '', new Buffer(JSON.stringify({ id })),  {
                // correlationId: generateUuid(),
                // replyTo: 'test-reply'б
                // expiration: 1000,
            })
        })
}

function initRabbit() {
    return amqp.connect(rabbitUrl)
        .then((conn) => {
            console.log(`[${processId}] connection success`);
            return conn.createChannel();
        })
        .then((ch) => {
            console.log(`[${processId}] chanel success`);

            ch.prefetch(3, false); // Per consumer limit
            ch.prefetch(6, true);  // Per channel limit

            return Promise.all([
                ch,
                // ch.assertQueue('test-reply'),
                // ch.assertQueue('test'),
                ch.assertExchange('logs', 'fanout'),
                // ch.bindQueue('test', 'logs', ''),
                // ch.assertExchange('bar'),
                // ch.bindQueue('foo', 'bar', 'baz'),
                // ch.consume('test-reply', (msg) => {
                //     ch.ack(msg);
                //     console.log('Message:');
                //     console.log(msg.content.toString());
                // }),
                // sendMessage(ch),
                // sendMessage(ch),
                // sendMessage(ch),
                // sendMessage(ch),
                // sendMessage(ch),
                // sendMessage(ch),
                // sendMessage(ch),
                // sendMessage(ch),
            ]);
        })
        .then((resp) => {
            publishMessage(resp[0]);
            return delay(1000, resp);
        })
        .then((resp) => {
            publishMessage(resp[0]);
            return delay(1000, resp);
        })
        .then((resp) => {
            publishMessage(resp[0]);
            return delay(1000, resp);
        })
        .then((resp) => {
            publishMessage(resp[0]);
            return delay(1000, resp);
        })
        .then((resp) => {
            publishMessage(resp[0]);
            return delay(1000, resp);
        })
        // .then(function([ch]) {
        //     return Promise.all([
        //         // ch.assertQueue('test-reply'),
        //         // ch.assertQueue('test'),
        //         // ch.assertExchange('bar'),
        //         // ch.bindQueue('foo', 'bar', 'baz'),
        //         Promise.resolve()
        //             .then(() => {
        //                 console.log(`[${processId}] consume to "test" queue`);
        //             }),
        //         ch.consume('test', (msg) => {
        //             const msgContent = msg.content.toString();
        //             const msgObj = JSON.parse(msgContent);
        //             const { id } = msgObj;
        //             console.log(`[${processId}] с1 get message "${id}" from "test" queue`);
        //
        //             setTimeout(() => {
        //                 console.log(`[${processId}] с1 ack message "${id}" from "test" queue`);
        //                 ch.ack(msg);
        //             }, 10000)
        //         }),
        //
        //         ch.consume('test', (msg) => {
        //             const msgContent = msg.content.toString();
        //             const msgObj = JSON.parse(msgContent);
        //             const { id } = msgObj;
        //             console.log(`[${processId}] с2 get message "${id}" from "test" queue`);
        //
        //             setTimeout(() => {
        //                 console.log(`[${processId}] с2 ack message "${id}" from "test" queue`);
        //                 ch.ack(msg);
        //             }, 10000)
        //         }),
        //         // ch.sendToQueue('test', new Buffer(JSON.stringify({a: 10})),  {
        //         //     // correlationId: generateUuid(),
        //         //     // replyTo: 'test-reply'
        //         // }),
        //     ]);
        // });
}

return Promise.resolve()
    .then(() => (initServer()))
    .then(() => (initRabbit()))
    .catch((err) => {
        console.log(err);
    });