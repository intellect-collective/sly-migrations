var crypto = require('crypto');
var path = require('path');
var fs = require('fs');
var glob = require('glob');

var chain = require('./chaining');
var MigrationError = require('./MigrationError');

//----
// Helpers
//----

var checksum = function (content) {
    return crypto
        .createHash('md5')
        .update(content, 'utf8')
        .digest('hex');
};

var getDefaultMigrationDirectory = function () {
    return path.join(process.cwd(), 'migrations');
};

var statFile = function (path) {
    try {
        return fs.lstatSync(path);
    } catch (err) {}
    return null;
};

var processRawMigrationPaths = function (handlers) {
    return function (_path) {
        var stat = statFile(_path);
        if (!stat) {
            return;
        }
        if (stat.isDirectory()) {
            return Object.keys(handlers)
                .map(function (extension) {
                    return path.join(_path, '**.' + extension);
                });
        }
        return _path;
    };
};

var concat = function (result, incoming) {
    if (!incoming) {
        return result;
    }
    return result.concat(incoming);
};

//----
// Meat and potatoes
//----
/**
 * Processes a set of files in sequential order in order to perform repeatable
 * operations against a datastore.
 *
 * @param {Object} [options] - A map of options governing the operation of the
 *         migration script
 * @param {Function} [options.success] - A callback which receives the filename
 *         and checksum when a migration is successful.
 * @param {Function} [options.failure] - A callback which receives the filename,
 *         checksum, and exception that was thrown when a migration failed
 * @param {String[]} [options.migrationPaths] - A list of either complete file
 *         names, or glob patterns where migration files may be found. Defaults
 *         to `$CWD/migrations/**.(js|sql)`.
 * @param {Number} [options.dir] - Indicates the sorting direction of the
 *         migration scripts. Typically, when migrating up the scripts will be
 *         sorted numerically in forward order, but when migrating down scripts
 *         would be sorted numerically in reverse order.
 * @param {Object} [options.handlers] - A map of handlers, keyed by file
 *         extension and whose value is a handler function designed to handle
 *         migration files with the given extension.
 * @param {Function} [callback] - A callback invoked once migration is complete
 */
module.exports = function (options, callback) {
    options = Object.assign({
        'beforeAll': function () {},
        'afterAll': function () {},
        'beforeEach': function () {},
        'success': function () {},
        'failure': function () {},
        'migrationPaths': getDefaultMigrationDirectory(),
        'dir': 1,
        'handlers': undefined
    }, options);

    if (!callback) {
        callback = function () {};
    }

    // Check handlers
    if (!options.handlers || Object.keys(options.handlers).length === 0) {
        throw new MigrationError('No handlers given');
    }
    options.handlers = Object.keys(options.handlers)
        .reduce(function (result, ext) {
            if (options.handlers[ext]) {
                result[ext] = options.handlers[ext];
            }
            return result;
        }, {});

    // Normalize incoming options
    if (!Array.isArray(options.migrationPaths)) {
        options.migrationPaths = [options.migrationPaths];
    }
    var files = options.migrationPaths
        .map(processRawMigrationPaths(options.handlers))
        .reduce(concat, [])
        .map(function (o) {
            return glob.sync(o);
        })
        .reduce(concat, [])
        .map(function (file) {
            var content = fs.readFileSync(file);
            return {
                'file': file,
                'path': path.dirname(file),
                'basename': path.basename(file),
                'number': path.basename(file).substr(0, path.basename(file).indexOf('_')),
                'checksum': checksum(content)
            };
        })
        .filter(function (file) {
            return file;
        });
    if (files.length === 0) {
        throw new MigrationError('No migration files found');
    }

    // Sort all our files
    files.sort((a, b) => {
        return a.number < b.number ? -1 : Number(a.number > b.number);
    });
    if (options.dir < 0) {
        files.reverse();
    }

    var funcs = files.map(function (file) {
        var ext = path.extname(file.file).substr(1);
        return function (callback) {
            // Give the option to skip the handler if need be
            if (options.beforeEach(file.file, file.checksum, options.dir) === false) {
                return callback();
            }
            // If the handler takes a callback
            if (options.handlers[ext].length === 3) {
                return options.handlers[ext](file.file, options.dir, function (err) {
                    if (err) {
                        options.failure(file.file, file.checksum, options.dir, err);
                        callback(err);
                    } else {
                        options.success(file.file, file.checksum, options.dir);
                        callback();
                    }
                });
            }
            // The handler does not require a callback
            try {
                options.handlers[ext](file.file, options.dir);
                options.success(file.file, file.checksum, options.dir);
                callback();
            } catch (err) {
                options.failure(file.file, file.checksum, options.dir, err);
                return callback(err);
            }
        };
    });
    funcs.unshift(options.beforeAll);
    funcs.push(options.afterAll);

    chain(funcs, callback)();
};