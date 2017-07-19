'use strict';
var beforeExit;

var terminator = function (sig) {
    if (typeof sig === 'string') {
        console.log('%s: Received %s - terminating sample app ...',
            new Date(), sig);
        if (beforeExit) {
            console.log('%s: Executing cleanup before exit.', new Date());
            beforeExit.emit('exit', function (e) {
                if (e) {
                    console.error(e);
                }
                console.log('%s: Node server stopped.', new Date());
                process.exit(1);
            });
        } else {
            console.log('%s: Node server stopped.', new Date());
            process.exit(1);
        }
    }
};

var setupTerminationHandlers = function () {
    //  Process on exit and signals.
    process.on('exit', function () {
        terminator();
    });
    process.on('error', console.error.bind(console));
    // Removed 'SIGPIPE' from the list - bugz 852598.
    ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
        'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
    ].forEach(function (element, index, array) {
        process.on(element, function () {
            terminator(element);
        });
    });
};
setupTerminationHandlers();

var Builder = require('./builder');

var serverPath = 'abstract-server/abstract-server-config.js';

var serverBuilder = new Builder(serverPath);

serverBuilder.build(function (err, app) {
    if (err) {
        throw err;
    }
    beforeExit = app.services.beforeExit;
    global.app = app;
    console.log('Application ' + app.name + ' ready! version: ' + app.version);
});
