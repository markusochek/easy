const express = require('express');
const EasyYandexS3 = require("easy-yandex-s3");
const expressFileUpload = require('express-fileupload');
const AWS = require('aws-sdk');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(expressFileUpload());

const s3 = new EasyYandexS3({
    auth: {
        accessKeyId: "YCAJEVX4iLmxHWwU3n7Z6InlC",
        secretAccessKey: "YCPNqKv682swLoxebhokTHfdQbcFUWp0TqbAeiof",
    },
    Bucket: "object-storage-grebnev",
    debug: false
});


const mq = new AWS.SQS({
    'region': 'ru-central1',
    'endpoint': 'https://message-queue.api.cloud.yandex.net',
});

// async function createQueue() {
//     params = {
//         'QueueName': 'mq_example_nodejs_sdk',
//     }
//
//     result = await mq.createQueue(params).promise();
//     queueUrl = result['QueueUrl'];
//
//     console.log('Queue created, URL: ' + queueUrl);
//
//     return queueUrl;
// }
//
// async function sendMessage(queueUrl) {
//     params = {
//         'QueueUrl': queueUrl,
//         'MessageBody': 'test message',
//     }
//
//     result = await mq.sendMessage(params).promise();
//
//     console.log('Message sent, ID: ' + result['MessageId']);
// }
//
// async function receiveMessage() {
//     params = {
//         'QueueUrl': queueUrl,
//         'WaitTimeSeconds': 10,
//     }
//
//     result = await mq.receiveMessage(params).promise();
//
//     result['Messages'].forEach(async function(msg) {
//         console.log('Message received')
//         console.log('ID: ' + msg['MessageId'])
//         console.log('Body: ' + msg['Body'])
//
//         deleteParams = {
//             'QueueUrl': queueUrl,
//             'ReceiptHandle': msg['ReceiptHandle'],
//         }
//
//         await mq.deleteMessage(deleteParams).promise()
//     })
// }
//
// async function deleteQueue() {
//     params = {
//         'QueueUrl': queueUrl,
//     }
//
//     result = await mq.deleteQueue(params).promise();
//
//     console.log('Queue deleted')
// }

app.post("/addImage", async function (request, response) {
    // const upload = await s3.Upload({buffer: request.files.photo.data}, "/gaika/");
    params = {
        'QueueName': 'mq_example_nodejs_sdk',
    }

    result = await mq.createQueue(params).promise();
    queueUrl = result['QueueUrl'];

    console.log('Queue created, URL: ' + queueUrl);

    response.send(
        {
            'statusCode': 200,
            'body': queueUrl
        }
    )
});


app.listen(3000);
// app.listen(process.env.PORT, () => {
//     console.log(`App listening at port ${process.env.PORT}`);
// });

