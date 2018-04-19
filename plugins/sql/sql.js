'use strict';

const Sequelize = require('sequelize');

module.exports = ['sql', ({options}) => {
    return {
        sql: () => new Sequelize(options.sqlUrl, options.sequelize)
    };
}];