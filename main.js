'use strict';
const Builder = require('./builder');
const serverBuilder = new Builder({debug: !process.env.PRODUCTION});
serverBuilder.build(process.env.module).then(app => {
    console.log(`Application started ${app.name}`);
}).catch((err) => {
    console.error('Application failed to launch!', err);
});
