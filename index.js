const express = require('express');
const EasyYandexS3 = require("easy-yandex-s3");
const expressFileUpload = require('express-fileupload');
const { SQSClient, CreateQueueCommand, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand} = require("@aws-sdk/client-sqs");
const {Driver, getCredentialsFromEnv, getLogger, IamAuthService, getSACredentialsFromJson, TableDescription, Column,
    Types
} = require('ydb-sdk');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(expressFileUpload());

const s3 = new EasyYandexS3({
    auth: {
        'accessKeyId': process.env.AWS_ACCESS_KEY_ID,
        'secretAccessKey': process.env.AWS_SECRET_ACCESS_KEY,
    },
    Bucket: "object-storage-grebnev",
    debug: false
});

const client = new SQSClient({
    'credentails' : {
        'accessKeyId': process.env.AWS_ACCESS_KEY_ID,
        'secretAccessKey': process.env.AWS_SECRET_ACCESS_KEY,
    },
    'region': 'ru-central1',
    'endpoint': 'https://message-queue.api.cloud.yandex.net',
});

const queueUrl = "https://message-queue.api.cloud.yandex.net/b1gt5r86r6tkhatg9ltm/dj600000001g9nqk05su/message-queue-grebnev"
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
    return client.send(new ReceiveMessageCommand(input))
}

async function deleteMessage(queueUrl, res) {
    const inputDelete = {
        QueueUrl: queueUrl,
        WaitTimeSeconds: Number(1),
        ReceiptHandle: res['Messages'][0]['ReceiptHandle'],
    }
    return client.send(new DeleteMessageCommand(inputDelete))
}

app.post("/queues", async function (request, response) {
    let queueUrl = await createQueue(client,  "message-queue-grebnev");
    response.send(
        {
            statusCode: 200,
            body: queueUrl
        }
    )
});

async function createTable() {
    await this.driver.tableClient.withSession(async (session) => {
        this.logger.info('Creating tables...');
        await session.createTable('images',
            new TableDescription()
                .withColumn(new Column('name', Types.UTF8))
                .withColumn(new Column('file_path', Types.UTF8,))
                .withColumn(new Column('created_at', Types.DATE,))
                .withColumn(new Column('small_file_path', Types.optional(Types.UTF8),))
                .withColumn(new Column('file_size', Types.optional(Types.UINT64),))
                .withColumn(new Column('height', Types.optional(Types.UINT64),))
                .withColumn(new Column('width', Types.optional(Types.UINT64),))
                .withPrimaryKey('file_path')
        );
    });
}
async function addImageDB(image, uploadKey) {
    return await this.driver.tableClient.withSession(async (session) => {
        const dateString = image.createdAt.getFullYear() + "-" + (image.createdAt.getMonth() + 1) + "-" + image.createdAt.getDay();
        const query = `
                INSERT INTO images
                (name, file_path, created_at, file_size, height, width) VALUES
                ("${image.name}", "${uploadKey}", Date("${dateString}"), ${image.fileSize}, ${image.height}, ${image.width});
                `;
        await session.executeQuery(query);
    });
}

app.post("/images", async function (request, response) {
    const upload = await s3.Upload({buffer: request.files.photo.data}, "/gaika/");
    await sendMessage(queueUrl, upload.key);

    this.logger = getLogger({level: 'debug'});
    const endpoint = 'grpcs://ydb.serverless.yandexcloud.net:2135';
    const database = '/ru-central1/b1gt5r86r6tkhatg9ltm/etnf6f84qpet3koe51ik';
    const saCredentials = getSACredentialsFromJson("authorized_key.json");
    const authService = new IamAuthService(saCredentials);
    this.driver = new Driver({endpoint, database, authService});
    if (!await this.driver.ready(10000)) {
        this.logger.fatal(`Driver has not become ready in 10 seconds!`);
        process.exit(1);
    }
    // await createTable();

    let image = {
        createdAt: new Date(request.body.createdAt),
        name: request.body.name,
        fileSize: request.body.fileSize,
        height: request.body.height,
        width: request.body.width,
    }
    await addImageDB(image, upload.key);


    response.send(
        {
            statusCode: 200,
            body: "yes yes"
        }
    )
});

app.get("/images", function (request, response) {
    receiveMessage(queueUrl)
        .then(res => deleteMessage(queueUrl, res)
        .then(() => {
            response.send(
                {
                    statusCode: 200,
                    body: res['Messages'][0]['Body']
                }
            )
        }))
});


app.listen(3000);
// app.listen(process.env.PORT, () => {
//     console.log(`App listening at port ${process.env.PORT}`);
// });

