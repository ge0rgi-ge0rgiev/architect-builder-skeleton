'use strict';

const express = require('express');

module.exports = ['expressApp', 'express', ({options}) => {
    const expressApp = express();
    expressApp.set('trust proxy', options.isProduction);
    return {
        expressApp,
        express
    };
}];