const EasyYandexS3 = require("easy-yandex-s3");

const s3 = new EasyYandexS3({
    auth: {
        accessKeyId: "YCAJEVX4iLmxHWwU3n7Z6InlC",
        secretAccessKey: "YCPNqKv682swLoxebhokTHfdQbcFUWp0TqbAeiof",
    },
    Bucket: "object-storage-grebnev",
    debug: false
});

module.exports.handler = async function (event, context) {
    const upload = await s3.Upload({buffer: context.files.photo.data}, "/gaika/");
    console.log(upload)

    return {
        statusCode: 200,
        body: upload.key
    };
}
