loadAPI(1);

var bitsurf = function () {};

// Load core
load('core/functions.js');
load('core/log.js');
load('core/inithooks.js');
load('core/injector.js');
load('core/setup.js');

bitsurf.log('----- ' + (new Date()).toLocaleString() + ' -----');
bitsurf.$$log('core loaded!');

// Load modules
load('bitsurf/module.js');

