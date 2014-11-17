(function (bitsurf, module) {

// $stream
// Manages async data in a lazy manner with an MQ-like interface
// with filters and more.
module.provider('$stream', function () {

    // ------------------------------------------------------------------
    //  StreamSelectorExpression
    // ------------------------------------------------------------------

    // TODO: Needs extensive test coverage
    function StreamSelectorExpression(expr) {
        var self = this;

        this.span = 0;

        if (bitsurf.isString(expr)) {
            if (SELECTOR_RULE_REGEX.test(expr)) {
                expr = this.constructor.parse(expr);
            } else {
                this.value = expr;
                return;
            }
        } else if (!bitsurf.isObject(expr)) {
            throw Error("SelectorExpression: invalid expression, '" + expr + "'");
        }

        this.values = [];
        this.ranges = [];

        // Sorting selectors, ranges before values
        expr.sort(function (a, b) {
            var r, aa = (typeof a !== 'number') ? 1 : 0,
                   bb = (typeof b !== 'number') ? 1 : 0;
            if (aa) a = a[0];
            if (bb) b = b[0];
            r = a - b;
            if (r == 0) r = bb - aa;
            return r;
        });

        // Compaction magic, don't touch this :3
        var start = (typeof expr[0] !== 'number') ? expr[0][0] : null,
            end = (typeof expr[0] !== 'number') ? expr[0][1] : null;
        bitsurf.forEach(expr, function (item) {
            if (typeof item !== 'number') {
                if (start === null) {
                    start = item[0];
                    end = item[1];
                }
                if (item[0] > end) {
                    self.ranges.push([start,end]);
                    self.span += end - start;
                    start = item[0];
                    end = item[1];
                } else if (item[1] > end) {
                    end = item[1];
                }
            } else {
                if (start === null && end === null) {
                    self.values.push(item);
                    self.span += 1;
                    end = item;
                }
                if (item > end) {
                    if (start !== null) {
                        self.ranges.push([start,end]);
                        self.span += end - start;
                        start = null;
                    }
                    self.values.push(item);
                    self.span += 1;
                    end = item;
                }
            }
        });
        if (start !== null) {
            this.ranges.push([start,end]);
            this.span += end - start;
        }
    }

    var SELECTOR_RULE_REGEX = /^((0x)?[0-9a-f]+)((,|-)(0x)?[0-9a-f]+)+$/i;
    StreamSelectorExpression.parse = function (expr) {
        var items = expr.split(','),
            values, result = [];
        bitsurf.forEach(items, function (item, key) {
            values = item.split('-');
            if (values.length <= 0 || values.length > 2) {
                throw Error("SelectorExpression: invalid selector, '" + item + "'");
            } else
            if (values.length == 2) {
                values[0] = parseInt(values[0]);
                values[1] = parseInt(values[1]);
                if (values[0] === NaN || values[1] === NaN) {
                    throw Error("SelectorExpression: not a number, '" + item + "'");
                }
                if (values[0] >= values[1]) {
                    throw Error("SelectorExpression: invalid range, '" + item + "'");
                }
                result.push(values);
            } else {
                values[0] = parseInt(values[0]);
                if (values[0] === NaN) {
                    throw Error("SelectorExpression: not a number, '" + item + "'");
                }
                result.push(values[0]);
            }
        });
        return result;
    };

    // ------------------------------------------------------------------
    //  Stream
    // ------------------------------------------------------------------

    function Stream( parent ) {
        this.parent = parent;
        this.modifiers = {};
        this.consumers = [];
    }

    // Append data to stream
    Stream.prototype.push = function( item ) {
        for ( var i = 0; i < this.consumers.length; i += 1 ) {
            this.consumers[ i ]( item );
        }
        return this;
    };

    // 

    // Filter with a function
    Stream.prototype.filter = function( fun ) {
        if (typeof fun === 'undefined') {
            return this;
        }
        var s = new this.constructor( this );
        s.modifiers.filter = fun;
        return s;
    };

    // Filter by property
    Stream.prototype.where = function( a, b ) {
        if ( typeof a === "object" ) {
            var result = this;
            bitsurf.forEach(a, function (rule, key) {
                result = result.where(key, rule);
            })
            return result;
        } else
        if ( typeof a === "string" ) {
            if (bitsurf.isArray(b)) {
                return this.filter(function (item) {
                    var i, ii;
                    for (i = 0, ii = b.length; i < ii; i += 1) {
                        if (typeof b[i] === 'object') {
                            if (item[a] > b[i][0] && item[a] < b[i][1]) {
                                return true;
                            }
                        } else {
                            if (item[a] == b[i]) {
                                return true;
                            }
                        }
                    }
                    return false;
                });
            } else {
                return this.filter(function (item) {
                    return item[a] == b;
                });
            }
        }
        return this;
    };

    // Map
    Stream.prototype.map = function( fun ) {
        var s = new this.constructor( this );
        if ( typeof fun !== "function" ) {
            // Return the given value
            s.modifiers.map = function() {
                return fun;
            }
        } else {
            // Return mapped value
            s.modifiers.map = fun;
        }
        return s;
    };

    // Invoke
    Stream.prototype.invoke = function( name, args ) {
        var s = new this.constructor( this );
        s.modifiers.map = function( item ) {
            return item[ name ].apply( item, args );
        }
        return s;
    }

    // Repeat incoming data given times
    Stream.prototype.repeat = function( num ) {
        if ( num === undefined ) {
            num = Infinity;
        }
        var s = new this.constructor( this );
        s.modifiers.repeat = num;
        return s;
    };

    // Repeat incoming data given times
    Stream.prototype.take = function( num ) {
        var s = new this.constructor( this );
        s.modifiers.take = num;
        return s;
    };

    // Repeat incoming data given times
    Stream.prototype.skip = function( num ) {
        var s = new this.constructor( this );
        s.modifiers.skip = num;
        return s;
    };

    // Add consumer, which is called on every message
    Stream.prototype.each = function( callback ) {
        var consumer = Stream.createConsumer( callback, this.modifiers );
        this.consumers.push( consumer );
        if ( this.parent !== undefined ) {
            this.parent.each( consumer );
        }
        return this;
    };

    // Add consumer, which is called once
    Stream.prototype.once = function( callback ) {
        this.modifiers.take = 1;
        var consumer = Stream.createConsumer( callback, this.modifiers );
        this.consumers.push( consumer );
        if ( this.parent !== undefined ) {
            this.parent.once( consumer );
        }
        return this;
    };

    // Create a consumer function with recursively mapped modifiers
    // All stream manipulating logic is here
    Stream.createConsumer = function( callback, modifiers ) {
        // Define default consumer
        var consumer = function( item ) {
            var status = callback( item );
            if ( status === undefined ) return true;
            return status;
        }

        if ( modifiers === undefined ) {
            return consumer;
        }

        // Apply modifiers to our consumer
        if ( typeof modifiers.filter === "function" ) {
            consumer = applyFilter( consumer, modifiers.filter );
        }
        if ( typeof modifiers.map === "function" ) {
            consumer = applyMap( consumer, modifiers.map );
        }
        if ( typeof modifiers.repeat === "number" ) {
            consumer = applyRepeat( consumer, modifiers.repeat );
        }
        if ( typeof modifiers.take === "number" ) {
            consumer = applyTake( consumer, modifiers.take );
        }
        if ( typeof modifiers.skip === "number" ) {
            consumer = applySkip( consumer, modifiers.skip );
        }
        return consumer;
    };

    function applyFilter( consumer, fun ) {
        return function( item ) {
            if ( fun( item ) ) {
                return consumer( item );
            } else {
                return false;
            }
        }
    }

    function applyMap( consumer, fun ) {
        return function( item ) {
            return consumer( fun( item ) );
        }
    }

    function applyRepeat( consumer, num ) {
        return function( item ) {
            for ( var i = 0; i < num; i += 1 ) {
                if ( consumer( item ) === false ) {
                    return false;
                }
            }
            return true;
        }
    }

    function applyTake( consumer, num ) {
        return function( item ) {
            if ( num > 0 ) {
                num -= 1;
                return consumer( item );
            }
            return false;
        }
    }

    function applySkip( consumer, num ) {
        return function( item ) {
            if ( num > 0 ) {
                num -= 1;
                return true;
            }
            return consumer( item );
        }
    }

    return {
        Stream: Stream,
        SelectorExpr: StreamSelectorExpression,
        $get: function () {
            return Stream;
        }
    };

});

})(bitsurf, bitsurf.module('bitsurf'));
