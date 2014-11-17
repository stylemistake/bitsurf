(function (bitsurf, module) {

module.provider('$device', function ($streamProvider) {

    var devices = {},
        DDOs = {},
        SelectorExpr = $streamProvider.SelectorExpr;

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
                bitsurf.forEach(DDOs[name].controls, function (control, controlId) {
                    var inputStream = DDOs[name].protocol.input;
                    bitsurf.forEach(control.selector, function (rule, key) {
                        var expr = new SelectorExpr(rule);
                        if (bitsurf.isDefined(expr.value)) {
                            inputStream = inputStream.where(key, expr.value);
                        } else {
                            inputStream = inputStream.where(key,
                                expr.ranges.concat(expr.values)
                            );
                        }
                    });
                    inputStream.each(control.handler);
                });
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
