'use strict';

const responders = require('./responders'),
    Terror = require('./terror'),
    logger = require('./logger');

module.exports = ['Terror', 'responders', 'logger', ({utilities, cache}) => {
    Terror.init(utilities);
    logger.init(Terror);
    responders.init(logger, cache);
    return {
        Terror,
        responders,
        logger
    }
}];

