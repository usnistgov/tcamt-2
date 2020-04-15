ARG dist=ubuntu
ARG tag=latest
FROM ${dist}:${tag}

MAINTAINER Sukchan Lee <acetcom@gmail.com>

RUN apt update && \
    apt upgrade -y && \
    apt install -y --no-install-recommends \
        software-properties-common \
        wget \
        gnupg \
        git \
        iproute2 \
        ca-certificates \
        netbase \
        pkg-config && \
    apt clean
RUN wget -qO - https://adoptopenjdk.jfrog.io/adoptopenjdk/api/gpg/key/public | apt-key add - && \
    add-apt-repository --yes https://adoptopenjdk.jfrog.io/adoptopenjdk/deb/
RUN apt install -y --no-install-recommends \
        adoptopenjdk-8-hotspot \
        maven && \
    apt clean
