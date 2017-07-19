'use strict';
var ok = require('okay');
var architect = require('architect');
var path = require('path');
var _ = require('lodash');

/**
 * Builder for building an app using a definition file or dependency array
 * @param definition {String|[String]} .js file path or dependency array
 * @constructor
 */
var Builder = function (definition) {
    if (typeof definition === 'string') {
        if (_.endsWith(definition, '.js')) {
            this.definitionFile = definition;
        } else {
            this.consumes = [definition];
        }
    } else if (_.isArray(definition)) {
        this.consumes = definition;
    } else {
        throw new Error('definition must be either a string of consume or an array of consumes');
    }

};

Builder.prototype.build = function (done) {
    var serverName, version, uiVersion;
    var requiredConsumes;
    var wholeServerConfig = [];
    var consumes;
    var configPath = path.join(__dirname, 'serverConfig.js');
    var serverConfig = architect.loadConfig(configPath);
    if (this.definitionFile) {
        var mainServerPath = path.join(__dirname, this.definitionFile);
        var mainServerConfig = architect.loadConfig(mainServerPath);
        var mainServer = mainServerConfig[0];
        consumes = mainServer.consumes;
        serverName = mainServer.name;
        version = mainServer.version;
        uiVersion = mainServer.uiVersion;
        wholeServerConfig.push(mainServer);
    } else {
        consumes = this.consumes;
        serverName = 'Builder';
    }
    requiredConsumes = _.zipObject(consumes, _.times(consumes.length, _.constant(serverName)));

    var depTree = {};
    var pluginTree = {};
    _.each(serverConfig, function (plugin) {
        _.each(plugin.provides, function (provided) {
            depTree[provided] = plugin.consumes;
            pluginTree[provided] = plugin;
        });
    });
    var allDependencies = {};
    var resolvedDependencies = {};
    while (!_.isEmpty(requiredConsumes)) {
        var newRequired = {};
        _.each(requiredConsumes, function (parent, consume) {
            allDependencies[consume] = parent;
            _.each(depTree[consume], function (dependency) {
                allDependencies[dependency] = consume;
                if (!resolvedDependencies[dependency]) {
                    newRequired[dependency] = consume;
                    resolvedDependencies[dependency] = consume;
                }
            });
            resolvedDependencies[consume] = parent;
        });
        requiredConsumes = newRequired;
    }

    var includedPlugins = {};
    _.each(allDependencies, function (t, dependency) {
        var plugin = pluginTree[dependency];
        if (!plugin) {
            if (pluginTree[t]) {
                throw new Error('Cannot resolve dependency ' + dependency + ' in ' + pluginTree[t].packagePath);
            } else {
                throw new Error('Cannot resolve dependency ' + dependency + ' in main server ' + t);
            }
        }
        var packagePath = plugin ? plugin.packagePath : null;
        if (!includedPlugins[packagePath]) {
            wholeServerConfig.push(plugin);
            includedPlugins[packagePath] = true;
        }
    });
    try {
        return architect.createApp(wholeServerConfig, ok(done, function (app) {
            app.name = serverName;
            app.version = version;
            app.uiVersion = uiVersion;
            done(null, app);
        }));
    }
    catch (e) {
        console.log(e);
    }
};

module.exports = Builder;