'use strict';

let utilities,
    _ = require('lodash');

class Terror extends Error {

    constructor(...args) {
        super(args);

        this.message;
        this.error;
        this.code;
        this.stack;
        this.status;
        this.terrorCode;
        this.metadata;
        this.utilities;

        this.setupArgs(args);
    }

    setupArgs(args) {
        let first = args[0];

        if (!first) {
            throw 'Unexpected error';
        }

        if (first instanceof Terror) {
            return first;
        }

        if (typeof first === 'string') {
            this.message = first;

            var second = args[1];
            if (second) {
                if (typeof second === 'number' || typeof second === 'object') {
                    this.code = second;
                } else {
                    this.error = this.parseError(second);
                    this.code = arguments[2];
                }
            }
        }

        if (first instanceof Error) {
            this.message = first.message;
            this.error = this.parseError(first);
            this.code = arguments[1];
            this.stack = first.stack;
        }

        if (!this.message) {
            this.message = first;
        }

        if (this.code && this.code.code) {
            this.terrorCode = this.code;
        }

        if (this.terrorCode) {
            this.code = this.terrorCode.code;
            this.status = this.terrorCode.status;
        }

        this.code = this.code || 1;
        this.status = this.status || 400;
    }

    setMetadata(metadata) {
        this.metadata = metadata;
        return this;
    }

    toJSON() {
        return {
            code: this.code,
            message: this.message,
            error: this.stringifyError(this.error),
            metadata: this.metadata
        }
    }

    stringifyError(err, filter, space) {
        var plainObject = {};
        if (!err) {
            return err;
        }
        if (typeof err === 'string') {
            return err;
        }
        Object.getOwnPropertyNames(err).forEach(function (key) {
            if (key === '' || key === 'domain') {
                return;
            }
            plainObject[key] = err[key];
        });
        return JSON.stringify(utilities.getClearObject(plainObject), filter, space);
    }

    parseError(err) {
        //mongoose validation err
        if (err && err.name === 'ValidationError') {
            return err.toString();
        }
        if (err && !_.isEmpty(err)) {
            return err;
        }
        return err;
    }

    static init(utilities) {
        utilities = utilities;
    }
}

Terror.Codes = {
    unauthorized: {
        code: 403,
        status: 403
    },
    notFound: {
        code: 404,
        status: 404
    }
};

module.exports = Terror;