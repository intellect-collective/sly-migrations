function MigrationError() {
    var temp = Error.apply(this, arguments);
    this.name = 'MigrationError';
    this.message = temp.message;
    this.stack = temp.stack;
}

MigrationError.prototype = Object.create(Error.prototype, {
    'constructor': {
        'value': MigrationError,
        'writable': true,
        'configurable': true
    }
});

module.exports = MigrationError;