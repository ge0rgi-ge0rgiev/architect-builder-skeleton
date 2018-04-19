'use strict';

const bodyParser = require('body-parser'),
    nodeDomain = require('express-domain-middleware'),
    bodyValidator = require('./bodyValidator');

function handleCors(req, res, next) {
    let respond = false;

    if (req.headers.origin) {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        respond = true;
    }

    if (req.headers['access-control-request-method']) {
        res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method']);
        respond = true;
    }

    if (req.headers['access-control-request-headers']) {
        res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
        respond = true;
    }

    if (respond && req.method.toUpperCase() === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
}

module.exports = (options, {responders, utilities}) => {
    return (app) => {
        app.use(nodeDomain);
        app.use(handleCors);
        app.use(bodyParser.urlencoded({
            extended: true
        }));
        app.use(bodyValidator.initialize(responders));
        app.use(bodyParser.json({
            limit: '50mb',
            reviver: utilities.reviveDates
        }));
        app.use(bodyParser.text());
    };
};
