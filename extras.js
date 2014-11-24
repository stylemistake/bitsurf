// --------------------------------------------------------
//  extras,js
//  A set of polyfills to make Bitwig more ECMAScript 5
//  compliant, and also adding lots of other useful
//  functions.
// --------------------------------------------------------
//  Note to devs:
//  Never use extras.js internally in modules. Modules
//  should only be dependent on bitsurf and other modules.
// --------------------------------------------------------

// Initialize bitsurf core functions if bitsurf wasn't loaded
if (typeof bitsurf === 'undefined') {
    loadAPI(1);
    var bitsurf = function () {};
    load('core/functions.js');
    load('core/log.js');
}

// Add `angular` namespace for compatibility with angular modules
var angular = angular || bitsurf;

// Add `console` polyfill
var console = console || {
    log: bitsurf.log
};

// Dirty `setTimeout` polyfill with no clearTimeout counterpart
var setTimeout = setTimeout || function (fn, timeout) {
        host.scheduleTask(fn, [], timeout);
    },
    clearTimeout = clearTimeout || bitsurf.noop;

// Dirty `setInterval` polyfill with no clearInterval counterpart
var setInterval = setInterval || function (fn, timeout) {
        function loop() {
            fn.call();
            setTimeout(loop, timeout);
        }
        setTimeout(loop, timeout);
    },
    clearInterval = clearTimeout || bitsurf.noop;

// `Array` polyfills
load('extras/array.js');

// `Function` polyfills
load('extras/function.js');

// `Number` polyfills
load('extras/number.js');

// `Object` polyfills
load('extras/object.js');

// `String` polyfills
load('extras/string.js');
