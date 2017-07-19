'use strict';
let beforeExit;

const terminator = function (sig) {
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

const setupTerminationHandlers = function () {
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

const Builder = require('./builder');

module.exports = function build(serverPluginPath, done) {
    const serverBuilder = new Builder(serverPluginPath);

    serverBuilder.build(done);
};
