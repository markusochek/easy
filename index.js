const express = require('express');
const EasyYandexS3 = require("easy-yandex-s3");
const expressFileUpload = require('express-fileupload');
const { SQSClient, CreateQueueCommand, SendMessageCommand, ReceiveMessageCommand} = require("@aws-sdk/client-sqs");

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

async function createQueue(client, QueueName) {
    const input = {
        QueueName: QueueName,
    };
    const command = new CreateQueueCommand(input);
    const response = await client.send(command);

    return response.QueueUrl;
}

async function sendMessage(queueUrl, message) {
    const input = {
        QueueUrl: queueUrl,
        MessageBody : message
    };
    const command = new SendMessageCommand(input);
    const response = await client.send(command);

    return response['MessageId'];
}

async function receiveMessage(queueUrl) {
    const input = {
        QueueUrl: queueUrl
    }

    const command = new ReceiveMessageCommand(input);
    const response = await client.send(command);
    console.log(response)
    return response;
}

async function deleteMessage(queueUrl, ) {
    input = {
        QueueUrl: queueUrl,
        WaitTimeSeconds: 10,
    }

    const command = new SendMessageCommand(input);
    const response = await client.send(command);

    return response['MessageId'];
}

async function deleteQueue() {
    params = {
        'QueueUrl': queueUrl,
    }

    result = await mq.deleteQueue(params).promise();

    console.log('Queue deleted')
}

const client = new SQSClient({
    'credentails' : {
        'accessKeyId': "YCAJEVX4iLmxHWwU3n7Z6InlC",
        'secretAccessKey': "YCPNqKv682swLoxebhokTHfdQbcFUWp0TqbAeiof",
    },
    'region': 'ru-central1',
    'endpoint': 'https://message-queue.api.cloud.yandex.net',
});

app.post("/addImage", async function (request, response) {
    // const upload = await s3.Upload({buffer: request.files.photo.data}, "/gaika/");
    let queueUrl = await createQueue(client,  "message-queue-grebnev");
    let messageId = await sendMessage(queueUrl, 'test message');
    let fwewf = await receiveMessage(queueUrl);
    // await deleteQueue(queueUrl);
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

