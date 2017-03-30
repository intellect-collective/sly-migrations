/* global beforeEach, describe, it */

var path = require('path');
var expect = require('chai').expect;
var migrate = require('../src/migrate');
var MigrationError = require('../src/MigrationError');

var files = [];

var call = function (func) {
    var args = Array.prototype.slice.call(arguments, 1);
    return function () {
        return func.apply(null, args);
    };
};

var before = function (callback) {
    files.push('before');
    callback();
};

var handler = function (file, dir, callback) {
    files.push(path.basename(file));
    callback();
};

describe('migrate()', function () {
    beforeEach(function () {
        files = [];
    });

    it('Throws error when no handlers are givne', function () {
        expect(migrate).to.throw(MigrationError, 'No handlers given');
    });

    it('Throws error when no migrations are found', function () {
        expect(call(migrate, {
            'handlers': {
                'js': function () {}
            }
        })).to.throw(MigrationError, 'No migration files found');
    });

    it('Accepts migration directory option', function () {
        migrate({
            'migrationPaths': path.join(__dirname, '_migrations'),
            'handlers': {
                'js': function () {}
            }
        });
    });

    it('Accepts array of migration paths', function () {
        migrate({
            'migrationPaths': [path.join(__dirname, '_migrations')],
            'handlers': {
                'js': function () {}
            }
        });
    });

    it('Accepts explicit files', function () {
        migrate({
            'migrationPaths': path.join(__dirname, '_migrations/1_core.sql'),
            'handlers': {
                'js': handler,
                'sql': handler
            }
        });
        expect(files).to.deep.equal([
            '1_core.sql'
        ]);
    });

    it('Executes scripts in order', function () {
        migrate({
            'migrationPaths': path.join(__dirname, '_migrations'),
            'handlers': {
                'js': handler,
                'sql': handler
            }
        });
        expect(files).to.deep.equal([
            '1_core.sql',
            '2_secondary.js'
        ]);
    });

    it('Executes down scripts in reverse order', function () {
        migrate({
            'migrationPaths': path.join(__dirname, '_migrations'),
            'handlers': {
                'js': handler,
                'sql': handler
            },
            'dir': -1
        });
        expect(files).to.deep.equal([
            '2_secondary.js',
            '1_core.sql'
        ]);
    });

    it('Can add handlers for other file types', function () {
        migrate({
            'migrationPaths': path.join(__dirname, '_migrations'),
            'handlers': {
                'js': handler,
                'sql': handler,
                'c': handler
            }
        });
        expect(files).to.deep.equal([
            '1_core.sql',
            '2_secondary.js',
            '3_tertiary.c'
        ]);
    });

    it('Can remove handlers for default types', function () {
        migrate({
            'migrationPaths': path.join(__dirname, '_migrations'),
            'handlers': {
                'js': undefined,
                'sql': handler
            }
        });
        expect(files).to.deep.equal([
            '1_core.sql'
        ]);
    });

    it('Calls given callback', function () {
        var called = false;
        var callback = function () {
            called = true;
        };
        migrate({
            'migrationPaths': path.join(__dirname, '_migrations'),
            'handlers': {
                'js': undefined,
                'sql': handler
            }
        }, callback);
        expect(called).to.be.true; // eslint-disable-line no-unused-expressions
    });

    it('Asynchronous style returns error to callback', function () {
        var err;
        var callback = function (_err) {
            files.push('done');
            err = _err;
        };
        migrate({
            'beforeAll': before,
            'migrationPaths': path.join(__dirname, '_migrations'),
            'handlers': {
                'js': function (file, dir, _callback) {
                    handler(file, dir, function () {});
                    _callback('A problem occurred');
                },
                'sql': handler
            }
        }, callback);

        // Expect(err).to.be.an(Error);
        expect(files).to.deep.equal([
            'before',
            '1_core.sql',
            '2_secondary.js',
            'done'
        ]);
        expect(err).to.equal('A problem occurred');
    });

    it('Synchronous style returns error to callback', function () {
        var err;
        var callback = function (_err) {
            files.push('done');
            err = _err;
        };
        migrate({
            'beforeAll': before,
            'migrationPaths': path.join(__dirname, '_migrations'),
            'handlers': {
                'js': function (file, dir) {
                    throw new Error('A problem occurred');
                },
                'sql': handler
            }
        }, callback);

        // Expect(err).to.be.an(Error);
        expect(files).to.deep.equal([
            'before',
            '1_core.sql',
            'done'
        ]);
        expect(err.message).to.equal('A problem occurred');
    });

    it('beforeEach() supports skipping a migration', function () {
        migrate({
            'beforeEach': function (file, checksum, dir) {
                if (path.basename(file) === '1_core.sql') {
                    return false;
                }
                return true;
            },
            'migrationPaths': path.join(__dirname, '_migrations'),
            'handlers': {
                'js': handler,
                'sql': handler
            }
        });

        // Expect(err).to.be.an(Error);
        expect(files).to.deep.equal([
            '2_secondary.js'
        ]);
    });
});