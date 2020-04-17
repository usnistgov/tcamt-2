Docker running example
===========================================

* Stop MongoDB
  $ brew services stop mongodb-community
  $ sudo systemctl stop mongodb.service

* Run TCAMT
  $ docker-compose run tcamt

* Development 
  $ docker-compose run dev

* Stop all container
  $ docker-compose down

* Remove All container
  $ docker rm $(docker ps -qa --no-trunc --filter "status=exited")

* Remove All volume
  $ docker volume rm $(docker volume ls -qf dangling=true)

* Remove All images
  $ docker rmi $(docker images -q)
