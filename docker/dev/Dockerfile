ARG username=acetcom
FROM ${username}/hl7-auth

MAINTAINER Sukchan Lee <acetcom@gmail.com>

RUN apt-get update && \
    apt-get upgrade -y && \
    DEBIAN_FRONTEND=noninteractive \
    apt-get install -y --no-install-recommends \
        manpages-dev \
        cscope \
        vim \
        gcc \
        sudo \
        iputils-ping \
        net-tools && \
    apt-get clean

COPY setup.sh /root

ARG username=acetcom
RUN useradd -m --uid=1000 ${username} && \
    echo "${username} ALL=(root) NOPASSWD:ALL" > /etc/sudoers.d/${username} && \
    chmod 0440 /etc/sudoers.d/${username}

WORKDIR /home/${username}

EXPOSE 8080 4200 8090
