(function (bitsurf, module) {

module.provider('$control', function ($injector) {
    var constructors = {},
        instances = {};

    return {
        register: function (name, factory) {
            constructors[name] = factory;
        },
        get: function (name) {
            return constructors[name];
        },
        $get: function () {
            return function (name) {
                if (!instances.hasOwnProperty(name)) {
                    return null;
                }
                return instances[name];
            };
        }
    };
})

})(bitsurf, bitsurf.module('bitsurf'));
