FROM phusion/baseimage:0.9.18

ENV ENVIRONMENT local
ENV PRODUCTION true

ENV NODEJS_PORT 9090
ENV NODEJS_IP localhost

ENV RAVEGEN_IP 163.172.206.27
ENV RAVEGEN_PORT 1234

#default is true if non-existant env variable on development machines
ENV SQL_SYNC false

ENV SQL_USERNAME nodejs
ENV SQL_PASSWORD sakjfhsgfdhjw3rlkj23..
ENV SQL_HOST 62.210.30.140
ENV SQL_PORT 3306
ENV SQL_DB_NAME fcom

ENV MONGO_URL localhost:27017
ENV MONGO_DB knowledge

ENV INSTANCES 4
ENV NODE_VERSION 6.7.0

CMD ["/sbin/my_init"]

RUN apt-get update && apt-get upgrade -y && apt-get install -y rsync git

RUN curl -SLO "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz" \
    && tar xvzf "node-v${NODE_VERSION}-linux-x64.tar.gz" -C /usr/local --strip-components=1 \
    && rm "node-v${NODE_VERSION}-linux-x64.tar.gz"

RUN apt-get install -y build-essential

RUN curl -SLO "https://www.python.org/ftp/python/2.7.11/Python-2.7.11.tgz" \
    && tar zxvf "Python-2.7.11.tgz" \
    && cd Python-2.7.11 \
    && ./configure \
    && make \
    && make install

ENV WORKDIR /var/www

# Install app
RUN rm -rf $WORKDIR/*
ADD . $WORKDIR

WORKDIR $WORKDIR

RUN npm install --production --quiet

RUN sed "s/instances: 1,/instances: $INSTANCES,/g" process.yaml > process.yaml.tmp && mv process.yaml.tmp process.yaml
#install pm2
RUN npm install pm2@latest -g --quiet

EXPOSE $NODEJS_PORT

CMD pm2 start --no-daemon process.yaml
