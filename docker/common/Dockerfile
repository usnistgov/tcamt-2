ARG username=acetcom
FROM mongo

MAINTAINER Sukchan Lee <acetcom@gmail.com>

RUN apt update && \
    apt upgrade -y && \
    apt install -y --no-install-recommends \
        software-properties-common \
        wget \
        curl \
        gnupg \
        git \
        iproute2 \
        ca-certificates \
        netbase \
        pkg-config && \
    apt clean
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt install -y --no-install-recommends \
        nodejs ruby-full ruby-compass && \
    apt clean
RUN npm install -g bower grunt-cli
RUN wget -qO - https://adoptopenjdk.jfrog.io/adoptopenjdk/api/gpg/key/public | apt-key add - && \
    add-apt-repository --yes https://adoptopenjdk.jfrog.io/adoptopenjdk/deb/
RUN apt install -y --no-install-recommends \
        adoptopenjdk-8-hotspot \
        maven && \
    apt clean
