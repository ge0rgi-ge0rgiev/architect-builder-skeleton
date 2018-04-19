'use strict';

module.exports = (options, {responders, Terror}) => {
    function errorHandler(err, req, res, next) { //request handler with 4 params is an error handler
        const terror = new Terror(err);
        responders.respondError(res, terror);
        if (err.domain) {
            //you should think about gracefully stopping & respawning your server
            //since an unhandled error might put your application into an unknown state
        }
    }

    function notFound(req, res, next) {
        responders.respondError(res, new Terror('Endpoint not found', Terror.Codes.notFound));
    }

    return function (app) {
        app.use(errorHandler);
        app.use(notFound);
    };
};