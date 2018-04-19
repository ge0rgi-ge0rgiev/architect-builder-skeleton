'use strict';

const sql = {
    // // "**\plink.exe" -ssh **@163.172.126.31 -pw ** -T -L 10022:admin1.mediaone.bg:3306
    // dialect: 'mysql',
    // host: process.env.SQL_HOST || 'localhost',
    // port: process.env.SQL_PORT || 10022,
    // user: process.env.SQL_USERNAME || 'zdravei_dev',
    // password: process.env.SQL_PASSWORD || 'gedemia10..emedmc',
    // database: process.env.SQL_DB_NAME || 'zdravei_dev'

    dialect: 'mysql',
    host: process.env.SQL_HOST || 'localhost',
    port: process.env.SQL_PORT || 3306,
    user: process.env.SQL_USERNAME || 'root',
    password: process.env.SQL_PASSWORD || 'root',
    database: process.env.SQL_DB_NAME || 'numerology-api'
};

const sqlUrl = process.env.SQL_URL || (sql.dialect + '://' + sql.user + ':' + sql.password + '@' + sql.host + ':' + sql.port + '/' + sql.database);

const isProduction = !!process.env.PRODUCTION;

let jwtSecret = 'S8Tz&98Hb#P7SZ[_';

module.exports = {
    'options.expressApp': {
        isProduction
    },
    'options.server': {
        host: process.env.NODEJS_IP || 'localhost',
        port: process.env.NODEJS_PORT || 7090,
        logger: {
            enabled: true,
            headers: true,
            body: false,
            user: true
        }
    },
    'options.sql': {
        sqlUrl,
        sequelize: {
            logging: false,
            pool: {
                maxConnections: 5, //we don't need many connections on questionnaire
                minConnections: 2,
                maxIdleTime: 60000
            }
        }
    },
    'options.users': {
        jwtSecret
    },
    'options.utilities': {
        geoNamesUsername: 'zdravei400',
        googleApisPlaceKey: 'AIzaSyBISJ9l3smi42hB0HdV5ZIOt8A5TlsV56Y'
    },
};
