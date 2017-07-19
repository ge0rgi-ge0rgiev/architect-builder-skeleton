'use strict';

const sql = {
    dialect: 'mysql',
    host: process.env.SQL_HOST || 'localhost',
    port: process.env.SQL_PORT || 10022,
    user: process.env.SQL_USERNAME || 'root',
    password: process.env.SQL_PASSWORD || '*****',
    database: process.env.SQL_DB_NAME || '*****'
};

const sqlUrl = process.env.SQL_URL || (sql.dialect + '://' + sql.user + ':' + sql.password + '@' + sql.host + ':' + sql.port + '/' + sql.database);

let mongoUrl = process.env.MONGO_URL || 'localhost:10023';
const mongoUser = process.env.MONGO_USER || '';
const mongoPass = process.env.MONGO_PASSWORD || '';
const mongoParams = '';
let mongodbBaseUrl = 'mongodb://' + mongoUser + ':' + mongoPass + '@' + mongoUrl;
mongodbBaseUrl = mongodbBaseUrl.replace(':@', '');
const dbName = process.env.MONGO_DB || 'db';
mongoUrl = mongodbBaseUrl + '/' + dbName + mongoParams;

module.exports = {
    sqlUrl,
    mongoUrl
};