var normalize = function (func, final) {
    if (func.length === 1) {
        return func;
    }

    return function (callback) {
        try {
            func();
            callback();
        } catch (err) {
            final(err);
        }
    };
};

var chainable = function (func, callback, final) {
    return function () {
        func(function (err) {
            if (err) {
                return final(err);
            }
            callback();
        });
    };
};

var chain = function (functions, callback) {
    if (!Array.isArray(functions)) {
        throw new Error('First argument must be an array of functions');
    }
    functions.reverse();

    functions = functions.map(function (func) {
        return normalize(func, callback);
    });

    // We iterate over the incoming functoins in reverse order, starting
    // with the last. That last function is the inner-most, as it is to
    // be called last. So truly, the callback is the innermost as it's
    // the final call of all
    var inner = functions.reduce(function (result, func) {
        return chainable(func, result, callback);
    }, callback);

    return inner;
};

module.exports = chain;