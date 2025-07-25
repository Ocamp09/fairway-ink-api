# Dockerfile
FROM mysql:8.4.6

ENV MYSQL_DATABASE=fairway_ink
ENV MYSQL_ROOT_PASSWORD=pwd

COPY schema.sql /docker-entrypoint-initdb.d/
