ARG username=acetcom
FROM ${username}/hl7-common

MAINTAINER Sukchan Lee <acetcom@gmail.com>

RUN mkdir -p /var/log/hl7-auth
RUN mkdir -p /var/log/igamt
RUN mkdir -p /var/log/tcamt

RUN mkdir -p /usr/local/etc/hit/auth
COPY ./privateKey.txt /usr/local/etc/hit/auth
RUN mkdir -p /usr/local/etc/hit/igamt
COPY ./publicKey.txt /usr/local/etc/hit/igamt
RUN mkdir -p /usr/local/etc/hit/tcamt
COPY ./publicKey.txt /usr/local/etc/hit/tcamt

WORKDIR /root
ARG USER=usnistgov

ARG REPO=hl7-auth
ARG BRANCH=develop
RUN	git clone https://github.com/$USER/$REPO
ADD https://api.github.com/repos/$USER/$REPO/git/refs/heads/$BRANCH /root/auth-ver.json

WORKDIR /root/$REPO
RUN	git fetch && git checkout -f -B $BRANCH origin/$BRANCH

RUN mvn install

EXPOSE 8090
