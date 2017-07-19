'use strict';

module.exports = function (options, imports, register) {
    imports.server(options.server, imports, (err, server) => {
        if (err) {
            return register(err);
        }

        if (options.syncDb) {
            console.log('Syncing SQL...');
            imports.database.sequelize.sync({force: options.forceSyncDb}).then(function () {
                console.log('SQL synced!');
                register();
            }).catch(register);
        } else {
            register();
        }
    });
};