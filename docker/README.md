Docker running example
===========================================

* Stop MongoDB
  $ brew services stop mongodb-community
  $ sudo systemctl stop mongodb.service

* Build Image
  $ docker-compose build

* Development 
  $ docker-compose run dev

* Runtime
  $ docker-compose \
    -f docker-compose.yml -f docker-compose.run.yml run run

* Test
  $ docker-compose \
    -f docker-compose.yml -f docker-compose.test.yml run test

* Test(ubuntu:artful)
  $ TAG=eoan docker-compose build
  $ TAG=eoan docker-compose \
    -f docker-compose.yml -f docker-compose.test.yml run test

* Development(fedora:latest)
  $ DIST=fedora docker-compose build
  $ DIST=fedora docker-compose run dev

* Runtime(debian:jessie)
  $ DIST=debian TAG=stretch docker-compose build
  $ DIST=debian TAG=stretch docker-compose 
    -f docker-compose.yml -f docker-compose.run.yml run run

* Stop all container
  $ docker-compose down

* Remove All container
  $ docker rm $(docker ps -qa --no-trunc --filter "status=exited")

* Remove All volume
  $ docker volume rm $(docker volume ls -qf dangling=true)

* Remove All images
  $ docker rmi $(docker images -q)
