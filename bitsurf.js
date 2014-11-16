loadAPI(1);

var bitsurf = function () {};

// Load core
load('bitsurf.functions.js');
load('bitsurf.log.js');
load('bitsurf.hooks.js');
load('bitsurf.injector.js');
load('bitsurf.setup.js');

bitsurf.log('----- ' + (new Date()).toLocaleString() + ' -----');
bitsurf.$$log('core loaded!');

// Load modules
load('bitsurf-core/setup.js');

