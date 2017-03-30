/* eslint-disable no-console */

var path = require('path');
var migrate = require('./migrate');

var isFunction = function (obj) {
    return Boolean(obj && obj.constructor && obj.call && obj.apply);
};

module.exports = function (file, config, callback) {
    if (isFunction(file)) {
        callback = file;
        file = undefined;
    }
    if (isFunction(config)) {
        callback = config;
        config = undefined;
    }
    if (!file) {
        file = path.join(process.cwd(), 'sly');
        try {
            file = require(file);
        } catch (err) {
            console.error(err.stack);
            throw new Error('Unable to open sly configuration at ' + file);
        }
    }

    if (!callback) {
        callback = function (err) {
            if (err) {
                console.error(err.stack);
                // Throw err;
            }
            console.log('Migration complete');
        };
    }

    config = Object.assign({}, file, config);
    return migrate(config, callback);
};