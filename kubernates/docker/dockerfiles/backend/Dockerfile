FROM alpine:3.13.2
RUN apk add --update nodejs nodejs-npm
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app
RUN npm install
COPY . /usr/src/app
CMD ["npm", "start"]
