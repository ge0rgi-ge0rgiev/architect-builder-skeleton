'use strict';

const _ = require('lodash'),
    setupBeforeRequest = require('./setupBeforeRequest'),
    setupAfterRequest = require('./setupAfterRequest'),
    assert = require('assert');

/**
 * Initialize an express server that will listen on the standard port.
 * @param options
 * @param options.logger enabled/disable logging options for .headers and .body
 * @param imports imports defining the routes that the server will register
 * @param done
 */
module.exports = ['server', ({imports, database, options, expressApp, utilities, responders, apiVersions, Terror}) => {
    return new Promise((resolve, reject) => {
        const server = require('http').Server(expressApp);

        function setupExpressApp(options, routeImports) {
            let loggerOptions;

            function reloadLoggerOptions(opts) {
                //reload logger options either from argument or process env variables
                loggerOptions = _.defaults(opts || {
                    body: process.env.LOGGER_BODY,
                    headers: process.env.LOGGER_HEADERS,
                    user: process.env.LOGGER_USER,
                    result: process.env.LOGGER_RESULT,
                    disabled: process.env.LOGGER_DISABLED
                }, options.logger);
            }

            reloadLoggerOptions();
            return (app) => {
                app.get('/status', (req, res) => {
                    delete res.loggerArgs;//do not log /status requests
                    database.sequelize.authenticate().then(() => {
                        res.status(200).send({
                            db: 'OK',
                            name: global.app.name
                        });
                    }).catch(err => {
                        console.error(err);
                        res.status(200).send({
                            db: 'NO',
                            name: global.app.name
                        });
                    });
                });
                // default route have to be status 200
                // for HA Proxy
                app.get('/', (req, res) => {
                    res.status(200).send({
                        name: global.app.name
                    });
                });

                setupRoutes('Api/before', routeImports, app);

                const passport = require('passport');
                setupRoutes('Passport', routeImports, passport);
                app.use(passport.initialize());

                app.use((req, res, next) => {
                    if (req.url.length > 1 && loggerOptions && !loggerOptions.disabled) { //skip log for status check
                        const loggerArgs = [req.method + ': ' + req.url];
                        if (loggerOptions.headers) {
                            loggerArgs.push(req.headers);
                        }
                        if (loggerOptions.body && req.body) {
                            const bodyLogCopy = _.extend({}, req.body);
                            if (bodyLogCopy.password) {
                                bodyLogCopy.password = '******';
                            }
                            loggerArgs.push(bodyLogCopy);
                        }
                        res.loggerArgs = loggerArgs;
                        res.loggerOptions = loggerOptions;
                    }

                    next();
                });
                app.post('/loggeroptions', responders.ensureAuthenticated('admin'), (req, res) => {
                    reloadLoggerOptions(req.body);
                    res.status(200).send('reloaded on ' + process.pid + ' ' + JSON.stringify(loggerOptions, null, 4));
                });
                setupRoutes('Api', routeImports, app);
                setupRoutes('Api/after', routeImports, app);
            };
        }

        function setupRoutes(suffix, routeImports, arg) {
            let count = 0;
            _.each(routeImports, (routeConstructor, importName) => {
                if (_.endsWith(importName, suffix) && !_.startsWith(importName, 'options')) {
                    routeConstructor.call(null, arg, responders, apiVersions); //TODO: refactor this to be as part of imports during build time
                    console.log('+ ' + importName + ' route +');
                    count++;
                }
            });
            console.log('= ' + (count ? count : 'No') + ' ' + suffix + ' routes =');
        }

        const ipAddress = options.host;
        const port = options.port;
        assert(ipAddress, 'server ipAddress option');
        assert(port, 'server port option');

        setupBeforeRequest(options, {utilities, responders})(expressApp);
        setupExpressApp(options, imports)(expressApp);
        setupAfterRequest(options, {responders, Terror})(expressApp);

        function cb(err) {
            if (err) {
                console.error('Server starting error!', err);
                return reject(err);
            }
            console.log('Server starting on ' + ipAddress + ':' + port + '.');

            resolve({
                server
            });
        }

        if (ipAddress === 'localhost' || ipAddress === '127.0.0.1') { //for local development call with 2 parameters because 'localhost' as ipAddress doesn't work.
            server.listen(port, cb);
        } else {
            server.listen(port, ipAddress, cb);
        }
    });
}];
