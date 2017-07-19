'use strict';
const ok = require('okay');
const architect = require('architect');
const path = require('path');
const _ = require('lodash');
const fs = require('fs');

/**
 * Goes through the given directory to return all files and folders recursively
 * @author Ash Blue ash@blueashes.com
 * @example getFilesRecursive('./folder/sub-folder');
 * @requires Must include the file system module native to NodeJS, ex. var fs = require('fs');
 * @param {string} folder Folder location to search through
 * @returns {object} Nested tree of the found files
 */
function getFilesRecursive (folder) {
    var fileContents = fs.readdirSync(folder),
        fileTree = [],
        stats;

    fileContents.forEach(function (fileName) {
        stats = fs.lstatSync(folder + '/' + fileName);

        if (stats.isDirectory()) {
            fileTree.push({
                name: fileName,
                children: getFilesRecursive(folder + '/' + fileName)
            });
        } else {
            fileTree.push({
                name: fileName
            });
        }
    });

    return fileTree;
};

/**
 * Builder for building an app using a definition file or dependency array
 * @constructor
 */
const Builder = function () {
};

Builder.prototype.build = function (done) {
    let serverName, version, uiVersion;
    let requiredConsumes;
    const wholeServerConfig = [];
    let consumes;
    const configPath = path.join(__dirname, 'serverConfig.js');
    // const serverConfig = architect.loadConfig(configPath);
    _.chain(['node_modules', 'plugins']).map(getFilesRecursive).union().each((dir) => {
        console.log(dir);
    });
    /*
    if (this.definitionFile) {
        const mainServerPath = path.join(__dirname, this.definitionFile);
        const mainServerConfig = architect.loadConfig(mainServerPath);
        const mainServer = mainServerConfig[0];
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

    const depTree = {};
    const pluginTree = {};
    _.each(serverConfig, function (plugin) {
        _.each(plugin.provides, function (provided) {
            depTree[provided] = plugin.consumes;
            pluginTree[provided] = plugin;
        });
    });
    const allDependencies = {};
    const resolvedDependencies = {};
    while (!_.isEmpty(requiredConsumes)) {
        const newRequired = {};
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

    const includedPlugins = {};
    _.each(allDependencies, function (t, dependency) {
        let plugin = pluginTree[dependency];
        if (!plugin) {
            if (pluginTree[t]) {
                throw new Error('Cannot resolve dependency ' + dependency + ' in ' + pluginTree[t].packagePath);
            } else {
                throw new Error('Cannot resolve dependency ' + dependency + ' in main server ' + t);
            }
        }
        const packagePath = plugin ? plugin.packagePath : null;
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
     */
};

module.exports = Builder;