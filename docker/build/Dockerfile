ARG dist=ubuntu
ARG tag=latest
ARG username=acetcom
FROM ${username}/${dist}-${tag}-hl7-base

MAINTAINER Sukchan Lee <acetcom@gmail.com>

WORKDIR /root
COPY setup.sh /root

ARG USER=usnistgov
ARG REPO=tcamt-2
ARG BRANCH=master
RUN	git clone https://github.com/$USER/$REPO
ADD https://api.github.com/repos/$USER/$REPO/git/refs/heads/$BRANCH /root/tcamt-ver.json

RUN	cd $REPO && \
	git fetch && git checkout -f -B $BRANCH origin/$BRANCH \
    mvn install
