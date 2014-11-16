(function (bitsurf) {

// ------------------------------------------------------------------
//  Bitsurf common functions
// ------------------------------------------------------------------

var hasOwnProperty = Object.prototype.hasOwnProperty,
    slice    = [].slice,
    splice   = [].splice,
    push     = [].push,
    toString = Object.prototype.toString;

function lowercase(string) {
    return isString(string) ? string.toLowerCase() : string;
}

function uppercase(string) {
    return isString(string) ? string.toUpperCase() : string;
}

function capitalize(string) {
    return isString(string) ?
        string.charAt(0).toUpperCase() + string.slice(1).toLowerCase() :
        string;
}

var SNAKE_CASE_REGEXP = /[A-Z]/g;
function snakecase(name, separator) {
    separator = separator || '_';
    return name.replace(SNAKE_CASE_REGEXP, function (letter, pos) {
        return (pos ? separator : '') + letter.toLowerCase();
    });
}

function objKeys(obj) {
    if (!isObject(obj) && (!isFunction(obj) || obj === null)) {
        return [];
    }
    var result = [], prop, i;
    for (prop in obj) {
        if (hasOwnProperty.call(obj, prop)) {
            result.push( prop );
        }
    }
    return result;
}

// Type checking functions
function isUndefined(value) {
    return typeof value === 'undefined';
}

function isDefined(value) {
    return typeof value !== 'undefined';
}

function isObject(value) {
    return value !== null && typeof value === 'object';
}

function isString(value) {
    return typeof value === 'string';
}

function isNumber(value) {
    return typeof value === 'number';
}

function isArray(value) {
    return Object.prototype.toString.call(value) === '[object Array]';
}

function isFunction(value) {
    return typeof value === 'function';
}

function isRegExp(value) {
    return toString.call(value) === '[object RegExp]';
}

function isBoolean(value) {
    return typeof value === 'boolean';
}

function isDate(value) {
    return toString.call(value) === '[object Date]';
}

function isArrayLike(value) {
    if (value == null) {
        return false;
    }
    var length = value.length;
    return isString(value) || isArray(value) || length === 0 ||
        typeof length === 'number' && length > 0 && (length - 1) in value;
}

function isPromiseLike(obj) {
    return obj && isFunction(obj.then);
}

function sortedKeys(obj) {
    return objKeys(obj).sort();
}

function forEach(obj, iterator, context) {
    var key, length;
    if (obj) {
        if (isFunction(obj)) {
            for (key in obj) {
                if (key != 'prototype' && key != 'length' && key != 'name' &&
                        (!obj.hasOwnProperty || obj.hasOwnProperty(key))) {
                    iterator.call(context, obj[key], key, obj);
                }
            }
        } else if (isArray(obj) || isArrayLike(obj)) {
            var isPrimitive = typeof obj !== 'object';
            for (key = 0, length = obj.length; key < length; key++) {
                if (isPrimitive || key in obj) {
                    iterator.call(context, obj[key], key, obj);
                }
            }
        } else if (obj.forEach && obj.forEach !== forEach) {
            obj.forEach(iterator, context, obj);
        } else {
            for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                    iterator.call(context, obj[key], key, obj);
                }
            }
        }
    }
    return obj;
}

function forEachSorted(obj, iterator, context) {
    var i, keys = sortedKeys(obj);
    for (i = 0; i < keys.length; i++) {
        iterator.call(context, obj[keys[i]], keys[i]);
    }
    return keys;
}

// Reverses `func(value, key)` to `func(key, value)`.
function reverseParams(iteratorFn) {
    return function (value, key) {
        iteratorFn(key, value);
    };
}

// Extends `dst` by copying own enumerable properties from `src`.
// You can specify multiple `src` objects.
function extend(dst) {
    for (var i = 1, ii = arguments.length; i < ii; i++) {
        var obj = arguments[i];
        if (obj) {
            var keys = objKeys(obj);
            for (var j = 0, jj = keys.length; j < jj; j++) {
                var key = keys[j];
                dst[key] = obj[key];
            }
        }
    }
    return dst;
}

function parseInt(str) {
    return parseInt(str, 10);
}

function inherit(parent, extra) {
    return extend(new (extend(function() {}, {prototype:parent}))(), extra);
}

// A function that performs nothing.
function noop() {}

// A function that returns its first argument.
function identity(arg) {
    return arg;
}

// A function that returns function returning a value.
function valueFn(value) {
    return function() {
        return value;
    };
}

// Trims a string
var RTRIM = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
function trim(value) {
    return isString(value) ? value.replace(RTRIM, '') : value;
}

var escapeForRegexp = function (s) {
    return s.replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').
        replace(/\x08/g, '\\x08');
};

// Returns {object} in the form of {key1:true, key2:true, ...}
function makeMap(str) {
    var obj = {}, items = str.split(","), i;
    for (i = 0; i < items.length; i++)
        obj[ items[i] ] = true;
    return obj;
}

// Creates a new object without a prototype.
function createMap() {
    return new (function(){});
}

function includes(array, obj) {
    return Array.prototype.indexOf.call(array, obj) != -1;
}

function arrayRemove(array, value) {
    var index = array.indexOf(value);
    if (index >= 0) {
        array.splice(index, 1);
    }
    return value;
}

// TODO: Needs testing
// Creates a deep copy of source
// * If no destination is supplied, a copy of the object or array is created.
// * If a destination is provided, all of its elements (for array) or
//   properties (for objects) are deleted and then all elements/properties from
//   the source are copied to it.
// * If `source` is not an object or array (inc. `null` and `undefined`),
//   `source` is returned.
// * If `source` is identical to 'destination' an exception will be thrown.
function copy(source, destination, stackSource, stackDest) {
    if (!destination) {
        destination = source;
        if (source) {
            if (isArray(source)) {
                destination = copy(source, [], stackSource, stackDest);
            } else if (isDate(source)) {
                destination = new Date(source.getTime());
            } else if (isRegExp(source)) {
                destination = new RegExp(source.source, source.toString().match(/[^\/]*$/)[0]);
                destination.lastIndex = source.lastIndex;
            } else if (isObject(source)) {
                var emptyObject = new (function(){});
                emptyObject.prototype = source.prototype;
                destination = copy(source, emptyObject, stackSource, stackDest);
            }
        }
    } else {
        if (source === destination) {
            throw Error("Can't copy! Source and destination are identical.");
        }
        stackSource = stackSource || [];
        stackDest = stackDest || [];
        if (isObject(source)) {
            var index = stackSource.indexOf(source);
            if (index !== -1) return stackDest[index];
            stackSource.push(source);
            stackDest.push(destination);
        }
        var result;
        if (isArray(source)) {
            destination.length = 0;
            for (var i = 0; i < source.length; i++) {
                result = copy(source[i], null, stackSource, stackDest);
                if (isObject(source[i])) {
                    stackSource.push(source[i]);
                    stackDest.push(result);
                }
                destination.push(result);
            }
        } else {
            if (isArray(destination)) {
                destination.length = 0;
            } else {
                forEach(destination, function (value, key) {
                    delete destination[key];
                });
            }
            for (var key in source) {
                if (source.hasOwnProperty(key)) {
                    result = copy(source[key], null, stackSource, stackDest);
                    if (isObject(source[key])) {
                        stackSource.push(source[key]);
                        stackDest.push(result);
                    }
                    destination[key] = result;
                }
            }
        }
    }
    return destination;
}

function shallowCopy(src, dst) {
    if (isArray(src)) {
        dst = dst || [];
        for (var i = 0, ii = src.length; i < ii; i++) {
            dst[i] = src[i];
        }
    } else if (isObject(src)) {
        dst = dst || {};
        for (var key in src) {
            if (!(key.charAt(0) === '$' && key.charAt(1) === '$')) {
                dst[key] = src[key];
            }
        }
    }
    return dst || src;
}

// Determines if two objects or two values are equivalent.
function equals(o1, o2) {
    if (o1 === o2) return true;
    if (o1 === null || o2 === null) return false;
    if (o1 !== o1 && o2 !== o2) return true; // NaN === NaN
    var t1 = typeof o1, t2 = typeof o2, length, key, keySet;
    if (t1 == t2) {
        if (t1 == 'object') {
            if (isArray(o1)) {
                if (!isArray(o2)) return false;
                if ((length = o1.length) == o2.length) {
                    for (key = 0; key < length; key++) {
                        if (!equals(o1[key], o2[key])) return false;
                    }
                    return true;
                }
            } else if (isDate(o1)) {
                if (!isDate(o2)) return false;
                return equals(o1.getTime(), o2.getTime());
            } else if (isRegExp(o1) && isRegExp(o2)) {
                return o1.toString() == o2.toString();
            } else {
                if (isArray(o2)) return false;
                keySet = {};
                for (key in o1) {
                    if (key.charAt(0) === '$' || isFunction(o1[key])) continue;
                    if (!equals(o1[key], o2[key])) return false;
                    keySet[key] = true;
                }
                for (key in o2) {
                    if (!keySet.hasOwnProperty(key) &&
                            key.charAt(0) !== '$' &&
                            o2[key] !== undefined &&
                            !isFunction(o2[key])) return false;
                }
                return true;
            }
        }
    }
    return false;
}

function concat(array1, array2, index) {
    return array1.concat(slice.call(array2, index));
}

function sliceArgs(args, startIndex) {
    return slice.call(args, startIndex || 0);
}

// Returns a function which calls function `fn` bound to `self`
// where `self` becomes `this` in scope of a function.
function bind(self, fn) {
    var curryArgs = arguments.length > 2 ? sliceArgs(arguments, 2) : [];
    if (isFunction(fn) && !(fn instanceof RegExp)) {
        return curryArgs.length
            ? function() {
                return arguments.length
                    ? fn.apply(self, concat(curryArgs, arguments, 0))
                    : fn.apply(self, curryArgs);
            }
            : function() {
                return arguments.length
                    ? fn.apply(self, arguments)
                    : fn.call(self);
            };
    }
    return fn;
}

// Returns function parameter names
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg,
    FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m,
    FN_ARG_SPLIT = /,/,
    FN_ARG = /^\s*(_?)(.+?)\1\s*$/;
function fnParams(fn) {
    var fnText, argDecl, args = [];
    if (typeof fn === "function") {
        fnText = fn.toString().replace(STRIP_COMMENTS, '');
        argDecl = fnText.match(FN_ARGS);
        forEach(argDecl[1].split(FN_ARG_SPLIT), function (arg){
            arg.replace(FN_ARG, function (all, underscore, name){
                args.push(name);
            });
        });
    }
    return args;
}

function anonFnStr(fn) {
    return 'function(' + bitsurf.fnParams(fn).join(',') + ')';
}

function assertArg(arg, name, reason) {
    if (!arg) {
        name = (name || '?');
        reason = (reason || "required");
        throw Error("Argument '" + name + "' is " + reason );
    }
    return arg;
}

function assertArgFn(arg, name, acceptArrayAnnotation) {
    if (acceptArrayAnnotation && isArray(arg)) {
        arg = arg[arg.length - 1];
    }
    return assertArg(
        isFunction(arg), name, 'not a function, got ' +
        (arg && typeof arg === 'object' ? arg.constructor.name || 'Object' : typeof arg)
    );
}

function assertNotHasOwnProperty(name, context) {
    if (name === 'hasOwnProperty') {
        throw Error("hasOwnProperty is not a valid " + context + " name");
    }
}



// ------------------------------------------------------------------
//  HashMap
// ------------------------------------------------------------------

// Computes a hash of an 'obj'.
function hashKey(obj, nextUidFn) {
    var key = obj && obj.$$hashKey;
    if (key) {
        if (typeof key === 'function') {
            key = obj.$$hashKey();
        }
        return key;
    }
    var objType = typeof obj;
    if (objType == 'function' || (objType == 'object' && obj !== null)) {
        key = obj.$$hashKey = objType + ':' + (nextUidFn || nextUid)();
    } else {
        key = objType + ':' + obj;
    }
    return key;
}

// HashMap
function HashMap(array, isolatedUid) {
  if (isolatedUid) {
    var uid = 0;
    this.nextUid = function() {
      return ++uid;
    };
  }
  forEach(array, this.put, this);
}

HashMap.prototype = {
    put: function(key, value) {
        this[hashKey(key, this.nextUid)] = value;
    },
    get: function(key) {
        return this[hashKey(key, this.nextUid)];
    },
    remove: function(key) {
        var value = this[key = hashKey(key, this.nextUid)];
        delete this[key];
        return value;
    }
};



// ------------------------------------------------------------------
//  Bitsurf bootstrap
// ------------------------------------------------------------------

function bootstrap(modules, config) {
    if (!isObject(config)) config = {};
    var defaultConfig = {
        strictDi: false
    };
    config = extend(defaultConfig, config);

    // Do bootstrap
    modules = modules || [];
    //modules.unshift('ng');
    var injector = bitsurf.injector(modules, config.strictDi);
    return injector;
}



// ------------------------------------------------------------------
//  Bitsurf exports
// ------------------------------------------------------------------

extend(bitsurf, {
    lowercase: lowercase,
    uppercase: uppercase,
    capitalize: capitalize,
    keys: objKeys,
    isUndefined: isUndefined,
    isDefined: isDefined,
    isObject: isObject,
    isString: isString,
    isNumber: isNumber,
    isArray: isArray,
    isFunction: isFunction,
    isRegExp: isRegExp,
    isBoolean: isBoolean,
    isDate: isDate,
    isArrayLike: isArrayLike,
    isPromiseLike: isPromiseLike,
    sortedKeys: sortedKeys,
    forEach: forEach,
    forEachSorted: forEachSorted,
    reverseParams: reverseParams,
    extend: extend,
    parseInt: parseInt,
    inherit: inherit,
    noop: noop,
    identity: identity,
    valueFn: valueFn,
    trim: trim,
    escapeForRegexp: escapeForRegexp,
    makeMap: makeMap,
    createMap: createMap,
    includes: includes,
    arrayRemove: arrayRemove,
    copy: copy,
    shallowCopy: shallowCopy,
    equals: equals,
    concat: concat,
    sliceArgs: sliceArgs,
    bind: bind,
    snakecase: snakecase,
    fnParams: fnParams,
    anonFnStr: anonFnStr,
    assertArg: assertArg,
    assertArgFn: assertArgFn,
    assertNotHasOwnProperty: assertNotHasOwnProperty,
    HashMap: HashMap,
    bootstrap: bootstrap
});

})(bitsurf);
