(function (bitsurf, module) {

module.provider('$device', function ($streamProvider, $controlProvider) {

    var constructors = {},
        instances = {},
        SelectorExpr = $streamProvider.SelectorExpr;

    function instantiate(name, $injector) {
        var device = instances[name] = $injector.invoke(constructors[name]);

        // Iterate over controls
        bitsurf.forEach(device.controls, function (control, controlId) {

            // Get stream object
            var inputStream = device.protocol.input;

            // Compile control selectors
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

            // Register control handler
            bitsurf.onInit(function () {
                if (bitsurf.isString(control.handler)) {
                    var constr = $controlProvider.get(control.handler),
                        handler = $injector.invoke(constr);
                    handler = new handler();
                    if (bitsurf.isFunction(handler.$receive)) {
                        inputStream.each(function (m) {
                            handler.$receive(m);
                        });
                    }
                } else
                if (bitsurf.isFunction(control.handler)) {
                    inputStream.each(function (m) {
                        control.handler(m);
                    });
                }
            });

        });

        return device;
    }

    return {
        register: function (name, fn) {
            bitsurf.assertNotHasOwnProperty(name, 'controller');
            if (bitsurf.isObject(name)) {
                bitsurf.extend(constructors, name);
            } else {
                constructors[name] = fn;
            }
        },
        $get: function ($injector) {
            bitsurf.forEach(constructors, function (constr, name) {
                instantiate(name, $injector);
            });
            return function (name) {
                return instances[name];
            };
        }
    };

});

// Always instantiate device provider on runtime
module.run(function ($device) {});

})(bitsurf, bitsurf.module('bitsurf'));
