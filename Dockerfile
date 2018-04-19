FROM phusion/baseimage:0.9.18

#ENV ENVIRONMENT local
#ENV PRODUCTION true

#ENV NODEJS_PORT 9090
#ENV NODEJS_IP localhost

ENV INSTANCES 1
ENV NODE_ENV production
ENV NODE_VERSION 8.9.1

CMD ["/sbin/my_init"]

RUN apt-get update && apt-get upgrade -y && apt-get install -y rsync git

RUN curl -SLO "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz" \
    && tar xvzf "node-v${NODE_VERSION}-linux-x64.tar.gz" -C /usr/local --strip-components=1 \
    && rm "node-v${NODE_VERSION}-linux-x64.tar.gz"

RUN apt-get install -y build-essential

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
