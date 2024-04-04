const express = require('express');
const EasyYandexS3 = require("easy-yandex-s3");
const expressFileUpload = require('express-fileupload');

const app = express()

app.use(expressFileUpload());

const s3 = new EasyYandexS3({
    auth: {
        accessKeyId: "YCAJEVX4iLmxHWwU3n7Z6InlC",
        secretAccessKey: "YCPNqKv682swLoxebhokTHfdQbcFUWp0TqbAeiof",
    },
    Bucket: "object-storage-grebnev",
    debug: false
});

app.post("/addImage", async function (request, response) {
    const upload = await s3.Upload({buffer: request.files.photo.data}, "/gaika/");
    console.log(upload)

    response.send(
        {
            'statusCode': 200,
            'body': upload.key
        }
    )
});


app.listen(3000);
