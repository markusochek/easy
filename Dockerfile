FROM node:16-slim

WORKDIR /app
RUN npm install express
RUN npm i easy-yandex-s3@1.1.8
RUN npm i express-fileupload

COPY ./index.js .

CMD [ "node", "index.js" ]
