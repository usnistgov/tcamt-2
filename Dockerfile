FROM tomcat:9.0.91-jdk8-temurin-noble
COPY ./tcamt-lite-controller/target/tcamt.war /usr/local/tomcat/webapps/tcamt.war