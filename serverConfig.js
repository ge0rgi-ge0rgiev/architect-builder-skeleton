var config = require('./config');

module.exports = [
    /* External plugins */
    {
        packagePath: '../node_modules/plugin-api-versions'
    },
    /* Internal plugins */
    {
        packagePath: './plugins/internal1',
        optionProperty: config.optionValue
    }
];