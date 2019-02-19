FROM mcr.microsoft.com/powershell:alpine-3.8
MAINTAINER hansvandenakker

RUN apk add --update \
    nodejs \
    npm \
    python \
    python-dev \
    py-pip \
    build-base \
    && pip install virtualenv \
    && rm -rf /var/cache/apk/*

RUN pwsh -Command Install-Module -Name Az -Scope CurrentUser -Force

WORKDIR /usr/src/app
COPY . .
RUN mkdir -p /usr/src/app/logs

RUN npm install pm2@latest -g
RUN npm install

VOLUME /usr/src/app/data
CMD ["pm2-runtime", "rclaimer.config.js"]
