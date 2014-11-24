// Instantiate module
bitsurf.module('bitsurf', []);

// Load components
load('providers/proto.js');
load('providers/proto.midi.js');
load('providers/stream.js');
load('providers/control.js');
load('providers/device.js');
load('providers/preferences.js');

bitsurf.$$log("module 'bitsurf' loaded!");
