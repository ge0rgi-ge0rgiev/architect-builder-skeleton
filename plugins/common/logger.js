'use strict';

let Terror;
const _ = require('lodash'),
    utc = require('moment').utc;

class Logger {
    constructor(prefix) {
        if (prefix) {
            this.prefix = `[${prefix}]`;
        }
    }

    timestamp() {
        return utc().format('DD/MM/YY HH:mm:ss:SSS');
    }

    log() {
        if (arguments.length) {
            console.log.apply(console, this.parseArgs(arguments));
        }
    }

    error() {
        if (arguments.length) {
            console.error.apply(console, this.parseArgs(arguments));
        }
    }

    parseArgs(args) {
        if (this.prefix) {
            Array.prototype.unshift.call(args, this.prefix);
        }
        Array.prototype.unshift.call(args, this.timestamp());
        return _.chain(args)
            .reject((r) => _.isObject(r) && !(r instanceof Error) ? _.isEmpty(r) : false)
            .map(val => {
                if (val && typeof(val) === 'object') { //stringify objects that are about to be logged, so console writes them on one line
                    if (val instanceof Error) {
                        return new Terror(val).toJSON();
                    }
                    return JSON.stringify(val);
                }
                return val;
            }).value();
    }
}

const defaultLogger = new Logger();

module.exports = {
    init: (T) => {
        Terror = T;
    },
    timestamp: defaultLogger.timestamp.bind(defaultLogger),
    log: defaultLogger.log.bind(defaultLogger),
    error: defaultLogger.error.bind(defaultLogger),
    create: (prefix) => new Logger(prefix)
};
