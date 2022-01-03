FROM node:16

WORKDIR /app

ARG DATABASE_URL
ENV DATABASE_URL $DATABASE_URL

RUN apt-get -y update
RUN apt-get install -y ffmpeg

COPY package*.json ./
RUN npm install

COPY prisma/ ./
RUN npx prisma generate

COPY . .
