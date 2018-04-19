'use strict';

const _ = require('lodash');

module.exports = ['database', ({sql, utilities}) => {
    const sequelize = sql();

    const database = {
        sequelize,
        t: (fn) => {
            return sequelize.transaction(fn);
        },
        import: (models) => {
            let modelsFn;
            if (typeof models === 'function') {
                modelsFn = models;
                const DataTypes = sequelize.Sequelize;
                models = models(sequelize, database, DataTypes, utilities);
            }
            _.each(models, (value, key) => {
                database[key] = value;
                console.log(`* ${key} model imported ${modelsFn ? `from ${modelsFn.name}` : ''} *`);
            });
        }
    };

    return {
        database
    }
}];