//globals
'use strict';
let logger, cache;
const ok = require('okay'),
    Terror = require('./terror'),
    passport = require('passport'),
    _ = require('lodash'),
    wrap = require('co-express'),
    co = require('co'),
    async = require('async');

const responders = {
    init: function (lg, cch) {
        logger = lg;
        cache = cch;
    },
    /**
     *
     * @param res
     * @param err
     * @param [next] if next is provided will call it and use the default errorHandler to respond. Otherwise will respond immediately
     * @returns {*}
     */
    respondError: function (res, err, next) {
        let data;
        if (typeof err === 'string') {
            data = err;
        } else {
            if (!(err instanceof Terror)) {
                err = new Terror(err);
            }
            data = err.toJSON();
        }
        const statusCode = err.status || 400;
        logger.error.apply(logger, [].concat(res.loggerArgs, [err.message, err.error, err.stack]));
        if (next) {
            return next(err);
        } else {
            res.status(statusCode).send(data);
        }
    },
    respondRaw: function (res, data) {
        logger.log.apply(logger, res.loggerArgs);
        res.status(200).send(data);
    },
    parseResult: function (result) {
        if (result && result.toJSON) {
            result = result.toJSON();
        } else if (_.isArray(result)) {
            result = _.map(result, responders.parseResult);
        } else if (_.isObject(result)) {
            const jsonResult = {};
            _.forIn(result, function (val, key) {
                jsonResult[key] = responders.parseResult(val);
            });
            result = jsonResult;
        }
        return result;
    },
    /**
     *
     * @param res
     * @param [result=true]
     * @param [path]
     */
    respondResult: function (res, result, path) {
        result = responders.parseResult(result);
        if (path) {
            result = _.get(result, path);
        }
        result = result === undefined ? true : result;
        const data = {
            result: result
        };
        responders.respondRaw(res, data);
    },
    wrapCached: function (handler, internalCacheVersion) {
        return wrap(function* (req, res) {
            if (handler.constructor.name === 'GeneratorFunction') {
                handler = co.wrap(handler);
            }
            responders.respondResultCached(req, res, handler, internalCacheVersion);
        });
    },
    /**
     * Returns a getAll handler for that model
     * @param database {Database} the database that will be used
     * @param databaseOrPromisable
     * @param [where] {Object} where expression
     * @param [order={createdAt:-1}] {Object} sorting expression.
     * @param [modifyResult] {Function} the function to modify the result of the get request
     * @param include
     * @returns {Function} function for handling a response
     */
    getAllGeneric: function getAllGeneric(databaseOrPromisable, {where, order, modifyResult, include} = {}) {
        const handleQuery = function (req) {
            const queryParams = req.query;
            let page = +queryParams.page || 1;
            page = page ? page - 1 : 0;
            const pageSize = +queryParams.pageSize || 10;
            const offset = pageSize * page;
            let useWhere, useOrder;
            try {
                if (typeof where === 'function') {
                    useWhere = where.call(null, req);
                } else if (typeof queryParams.filter === 'string') {
                    useWhere = JSON.parse(queryParams.filter);
                } else {
                    useWhere = queryParams.filter;
                }
            }
            catch (e) {
                console.log(e);
            }
            try {
                if (typeof order === 'function') {
                    useOrder = order.call(null, req);
                } else if (typeof queryParams.sort === 'string') {
                    useOrder = JSON.parse(queryParams.sort);
                } else {
                    useOrder = queryParams.sort;
                }
            }
            catch (e) {
                console.log(e);

            }

            useWhere = useWhere || where || {};
            useOrder = useOrder || order || [['createdAt', 'DESC']];
            let promise;
            if (databaseOrPromisable.findAndCountAll) {
                let query = {
                    where: useWhere,
                    order: useOrder,
                    distinct: include ? true : undefined,
                    include
                };
                if (pageSize) {
                    query.limit = pageSize;
                    query.offset = offset;
                }
                promise = databaseOrPromisable.findAndCountAll(query);
            } else {
                promise = databaseOrPromisable(req)
                    .then((result) => ({rows: _(result).slice(offset).take(pageSize).value(), count: result.length}));
            }
            modifyResult = modifyResult || _.identity;
            return promise.then(modifyResult);
        };

        return function (req, res, next) {
            handleQuery(req).then((r) => responders.respondRaw(res, r)).catch(next);
        }
    }

    ,
    respondResultCached: function (req, res, handler, internalCacheVersion = 1) {
        if (!cache) {
            throw new Error('Cache not initialized. Make sure you consume the cache plugin');
        }
        cache.wrap(`${req.method}_${req.originalUrl}_${internalCacheVersion}`,
            (cc) => {
                if (handler.then) {
                    return handler.then((result) => cc(null, responders.parseResult(result)))
                        .catch(responders.respondError.bind(responders, res));
                }
                const result = handler(req, res);
                if (result.then) {
                    result.then((result) => cc(null, responders.parseResult(result)))
                        .catch(responders.respondError.bind(responders, res));
                } else {
                    cc(null, responders.parseResult(result));
                }
            },
            responders.getResponder(res));
    }
    ,
    /**
     *
     * @param res
     * @param [path] responds with the path to a property of the result
     * @param [next] will next with an err as first argument if provided
     * @returns {Function} a function that is a handler of (err, result). Responds with error when there is an error and with a result when a result is available.
     */
    getResponder: function getResponder(res, path, next) {
        if (typeof path === 'function') {
            next = path;
            path = null;
        }

        return function baseResponder(err, result) {
            if (err) {
                if (next) {
                    next(err);
                } else {
                    responders.respondError(res, err);
                }
            } else {

                responders.respondResult(res, result, path);
            }
        };
    }
    ,
    /**
     * Gets a function that responds with a static transform function.
     * @param res
     * @param transform
     * @param [next]
     * @returns {Function}
     */
    getResponderWithTransform: function getResponderWithTransform(res, transform, next) {
        return function baseResponder(err, result) {
            if (err) {
                responders.respondError(res, err, next);
            } else {
                responders.respondResult(res, transform(result));
            }
        };
    }
    ,
    /**
     * Gets a function that responds with a static transform function.
     * @param res
     * @param transform
     * @param [next]
     * @returns {Function}
     */
    getResponderWithTransformAsync: function getResponderWithTransformAsync(res, transform, next) {
        return function baseResponder(err, result) {
            if (err) {
                responders.respondError(res, err, next);
            } else {
                transform(result, function (err, transformed) {
                    if (err) {
                        return responders.respondError(res, err, next);
                    }
                    responders.respondResult(res, transformed);
                });
            }
        };
    }
    ,
    /**
     * Responds unauthorized
     * @param resOrNext {res|next}
     * @private
     */
    respondUnauthorized: function (resOrNext) {
        const terror = new Terror('Unauthorized', Terror.codes.unauthorized);
        if (typeof resOrNext === 'function') {
            resOrNext(terror);
        } else {
            responders.respondError(resOrNext, terror);
        }
    }
    ,

    /**
     * Use arguments to provide authentication strategies to be ensured.
     * @param [...] Strategy names as an array of string or list of arguments. If no strategies list is provided we assume that we want ANY auth
     * @returns {Function}
     */
    ensureAuthenticated: function () {
        const args = Array.prototype.slice.call(arguments);
        let strategies;
        if (args.length > 0) {
            if (args.length === 1) {
                strategies = args[0];
            } else {
                strategies = args;
            }
            strategies = Array.isArray(strategies) ? strategies : [strategies];          //strategies is normalized to an array
        } else {
            strategies = null;
        }
        return function (req, res, next) {
            if (req.user) { //if already authorized
                if (strategies) {
                    if (strategies.indexOf(req.userInfo.level) >= 0) {
                        next();
                    } else {
                        return responders.respondUnauthorized(next);
                    }
                } else {
                    //if no strategies are provided to check then we are just looking for any authentication
                    return next();
                }
            } else {
                if (strategies) {
                    const strategyModifiers = {};
                    const effectiveStrategies = _.map(strategies, function (strategy) {
                        const split = strategy.split('.');
                        const effectiveStrategy = split[0];
                        let strategyModifier = split[1];
                        if (effectiveStrategy === 'user') {
                            strategyModifier = strategyModifier || 'admin';
                        }
                        strategyModifiers[effectiveStrategy] = strategyModifier;
                        return effectiveStrategy;
                    });
                    passport.authenticate(effectiveStrategies, {session: false}, function (err, user, info) {
                        if (err) {
                            return next(err);
                        } else {
                            if (!user) {
                                return responders.respondUnauthorized(next);
                            }
                            const authorizedStrategy = info.strategy;
                            if (authorizedStrategy && strategyModifiers[authorizedStrategy]) {
                                const strategyModifierSplit = strategyModifiers[authorizedStrategy].split(':');
                                const userProperty = strategyModifierSplit[0];
                                if (userProperty === 'admin') { // jshint ignore:line
                                    //full admin rights for admin strategy and level:admin of authenticated user (by DEFAULT)
                                } else {
                                    const expectedRequestProperty = strategyModifierSplit[1];
                                    let strategyModifierAuthenticationValue = user[userProperty];
                                    if (!strategyModifierAuthenticationValue) {
                                        return responders.respondUnauthorized(next);
                                    }
                                    if (expectedRequestProperty !== strategyModifierAuthenticationValue) {
                                        if (authorizedStrategy === 'user' && strategyModifierAuthenticationValue === 'admin') { // jshint ignore:line
                                            //full admin rights for admin strategy and level:admin of authenticated user
                                        } else if (strategyModifierAuthenticationValue &&
                                            (
                                                expectedRequestProperty === '*' ||
                                                (expectedRequestProperty === 'major' && strategyModifierAuthenticationValue === req[expectedRequestProperty])
                                            )) { // jshint ignore:line
                                            // leveled rights depending on strategy modifier
                                        } else {
                                            return responders.respondUnauthorized(next);
                                        }
                                    }
                                }
                            }
                            delete user.password;
                            req.user = user;
                            req.userInfo = info;
                            if (res.loggerArgs && res.loggerOptions && res.loggerOptions.user) {
                                res.loggerArgs.push(_.pick(req.user, ['id', 'fullName', 'email', 'level']));
                            }
                            next();
                        }
                    })(req, res, next);
                } else {
                    return responders.respondUnauthorized(next);
                }
            }
        };
    }
    ,

    /**
     * Gets a handler for ensuring a model exists in a certain model collection. From is either 'body' or 'params' and the key is the key to be looked for in the request.
     * @param from
     * @param key {String} key to be looked in the request
     * @param requestProperty {String} requestProperty of the object to match the key to be looked
     * @returns {Function}
     * @param filter {Function|String} property of function to be executed
     * @param dbModelFn {Function} the db model function
     * @param [noError=false] {Boolean} modifies the function to set 'requestProperty' to false if key is not present, and null when the model is not found
     * @param [modifyQuery] {Function}

     */
    ensureModelExists: function (from, key, requestProperty, filter, dbModelFn, noError, modifyQuery) {
        var filterFunction;
        if (typeof filter === 'function') {
            filterFunction = filter;
            filter = null;
        }

        if (typeof noError === 'function') {
            modifyQuery = noError;
            noError = null;
        }
        modifyQuery = modifyQuery || _.identity;

        return (req, res, next) => {
            var value;
            if (from === 'body') {
                if (req.required(key, next)) {
                    return;
                }
                value = req.body[key];
            } else {
                value = _.get(req, `${from}.${key}`);
            }

            if (value === undefined) {
                if (noError) {
                    req[requestProperty] = false;
                    return next();
                } else {
                    return next(new Terror(key + ' in ' + from + ' not provided to find ' + requestProperty));
                }
            }

            if (+value) {
                value = +value;
            }

            var complete = ok(next, function (model) {

                if (!model) {
                    var userInfo = '';
                    if (req.user) {
                        userInfo = ' User: { ' + req.user.id + ', ' + req.user.fullName + ', ' + req.user.email + ' }';
                    }
                    var error = new Terror(requestProperty + ' with ' + key + ' in ' + from + ': ' + value + ', doesn\'t exist.' + userInfo, Terror.codes.notFound);
                    if (noError) {
                        req[requestProperty] = null;
                        req.ensureModelError = error;
                        next();
                    } else {
                        next(error);
                    }
                } else {
                    req[requestProperty] = model;
                    next();
                }
            });

            if (filterFunction) {
                const promise = filterFunction(req, value, complete);
                if (promise && promise.then) {
                    promise.then((r) => complete(null, r)).catch(complete);
                }
            } else {
                let query = {
                    where: {}
                };
                query.where[filter] = value;
                query = modifyQuery(query, req);
                if (!query) {
                    req[requestProperty] = null;
                    return next();
                }
                dbModelFn.findOne(query).then((r) => complete(null, r)).catch(complete);
            }
        };
    }
};

module.exports = responders;