ARG username=acetcom
FROM ${username}/hl7-auth

MAINTAINER Sukchan Lee <acetcom@gmail.com>

WORKDIR /root
ARG USER=usnistgov

ARG REPO=tcamt-2
ARG BRANCH=docker
RUN	git clone https://github.com/$USER/$REPO
ADD https://api.github.com/repos/$USER/$REPO/git/refs/heads/$BRANCH /root/tcamt-ver.json

WORKDIR /root/$REPO
RUN git fetch && git checkout -f -B $BRANCH origin/$BRANCH

WORKDIR /root/$REPO/frontend
RUN bower install --allow-root && \
    npx npm-force-resolutions && \
    npm install && \
    grunt build

WORKDIR /root/$REPO
RUN mvn install -Dmaven.test.skip=true

EXPOSE 8080
