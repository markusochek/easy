const express = require('express');
const EasyYandexS3 = require("easy-yandex-s3");
const expressFileUpload = require('express-fileupload');
const { SQSClient, CreateQueueCommand, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand,
    DeleteQueueCommand
} = require("@aws-sdk/client-sqs");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(expressFileUpload());

const queueUrl = "https://message-queue.api.cloud.yandex.net/b1gt5r86r6tkhatg9ltm/dj600000001g9nqk05su/message-queue-grebnev"

const s3 = new EasyYandexS3({
    auth: {
        'accessKeyId': process.env.AWS_ACCESS_KEY_ID,
        'secretAccessKey': process.env.AWS_SECRET_ACCESS_KEY,
    },
    Bucket: "object-storage-grebnev",
    debug: false
});

async function createQueue(QueueName) {
    const input = {
        QueueName: QueueName,
    };
    const response = await client.send(new CreateQueueCommand(input));

    return response['QueueUrl'];
}

async function sendMessage(queueUrl, message) {
    const input = {
        QueueUrl: queueUrl,
        MessageBody : message
    };
    let response = await client.send(new SendMessageCommand(input))
    return response['MessageId']
}

async function receiveMessage(queueUrl) {
    const input = {
        QueueUrl: queueUrl,
        WaitTimeSeconds: Number(1),
    }
    client.send(new ReceiveMessageCommand(input)).then(function(res) {
        const inputDelete = {
            QueueUrl: queueUrl,
            WaitTimeSeconds: Number(1),
            ReceiptHandle: res['Messages'][0]['ReceiptHandle'],
        }
        client.send(new DeleteMessageCommand(inputDelete))
            .then(() => {
                response.send(
                    {
                        statusCode: 200,
                        body: res['Messages'][0]['Body']
                    }
                )
            })
    })
}

async function deleteQueue(queueUrl) {
    let input = {
        QueueUrl: queueUrl,
    }
    await client.send(new DeleteQueueCommand(input));
}

const client = new SQSClient({
    'credentails' : {
        'accessKeyId': process.env.AWS_ACCESS_KEY_ID,
        'secretAccessKey': process.env.AWS_SECRET_ACCESS_KEY,
    },
    'region': 'ru-central1',
    'endpoint': 'https://message-queue.api.cloud.yandex.net',
});

app.post("/queues", async function (request, response) {
    let queueUrl = await createQueue(client,  "message-queue-grebnev");
    response.send(
        {
            statusCode: 200,
            body: queueUrl
        }
    )
});

app.post("/images", async function (request, response) {
    const upload = await s3.Upload({buffer: request.files.photo.data}, "/gaika/");
    let messageId = await sendMessage(queueUrl, upload.key);
    response.send(
        {
            statusCode: 200,
            body: messageId
        }
    )
});

app.get("/images", function (request, response) {
    const input = {
        QueueUrl: queueUrl,
        WaitTimeSeconds: Number(1),
    }
    client.send(new ReceiveMessageCommand(input)).then(function(res) {
        const inputDelete = {
            QueueUrl: queueUrl,
            WaitTimeSeconds: Number(1),
            ReceiptHandle: res['Messages'][0]['ReceiptHandle'],
        }
        client.send(new DeleteMessageCommand(inputDelete))
            .then(() => {
                response.send(
                    {
                        statusCode: 200,
                        body: res['Messages'][0]['Body']
                    }
                )
            })
    })
});


app.listen(3000);
// app.listen(process.env.PORT, () => {
//     console.log(`App listening at port ${process.env.PORT}`);
// });

