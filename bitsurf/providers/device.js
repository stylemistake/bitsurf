(function (bitsurf, module) {

module.provider('$device', function () {

    var devices = {},
        DDOs = {};

    return {
        register: function (name, fn) {
            bitsurf.assertNotHasOwnProperty(name, 'controller');
            if (bitsurf.isObject(name)) {
                bitsurf.extend(devices, name);
            } else {
                devices[name] = fn;
            }
        },
        $get: function ($injector) {
            bitsurf.forEach(devices, function (device, name) {
                DDOs[name] = $injector.invoke(device);
            });
            return function (name) {
                return DDOs[name];
            }
        }
    };

});

// Always instantiate device provider on runtime
module.run(function ($device) {});

})(bitsurf, bitsurf.module('bitsurf'));
