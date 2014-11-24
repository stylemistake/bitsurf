// --------------------------------------------------------
//  `Function` polyfills
// --------------------------------------------------------

// Sets `this` variable for a function.
// Returns a bound function.
Function.prototype.bind = function (o) {
    if (typeof this !== 'function') {
        throw TypeError('Bind must be called on a function');
    }
    var slice = [].slice,
        args = slice.call(arguments, 1),
        self = this,
        bound = function () {
            return self.apply(
                this instanceof nop ? this : (o || {}),
                args.concat(slice.call(arguments))
            );
        };

    /** @constructor */
    function nop() {}
    nop.prototype = self.prototype;
    bound.prototype = new nop();

    return bound;
};
