'use strict';

const _ = require('lodash');

module.exports = ['exampleApi', ({database, express}) => {
    return {
        exampleApi(app, responders, apiVersions) {
            const exampleRouter = express.Router({mergeParams: true});

            exampleRouter.get('/', (req, res, next) => {
                return responders.respondResult(res, 'Example text response');
            });

            app.use('/:version/example', apiVersions(1), /*responders.ensureAuthenticated('bearer'),*/ exampleRouter);
        }
    };
}];