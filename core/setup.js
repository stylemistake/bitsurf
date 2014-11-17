(function (bitsurf) {

// ------------------------------------------------------------------
//  Setup module loader
// ------------------------------------------------------------------

function ensure(obj, name, factory) {
    return obj[name] || (obj[name] = factory());
}

ensure(bitsurf, 'module', function() {
    var modules = {};
    return function module(name, requires, configFn) {
        var assertNotHasOwnProperty = function(name, context) {
            if (name === 'hasOwnProperty') {
                throw Error('hasOwnProperty is not a valid ' + context + ' name');
            }
        };
        assertNotHasOwnProperty(name, 'module');
        if (requires && modules.hasOwnProperty(name)) {
            modules[name] = null;
        }
        return ensure(modules, name, function() {
            if (!requires) {
                throw Error("Module '" + name + "' is not available");
            }
            var invokeQueue = [];
            var configBlocks = [];
            var runBlocks = [];
            var config = invokeLater('$injector', 'invoke', 'push', configBlocks);

            var moduleInstance = {
                _invokeQueue: invokeQueue,
                _configBlocks: configBlocks,
                _runBlocks: runBlocks,
                requires: requires,
                name: name,

                // Core methods
                provider: invokeLater('$provide', 'provider'),
                factory: invokeLater('$provide', 'factory'),
                service: invokeLater('$provide', 'service'),
                value: invokeLater('$provide', 'value'),
                constant: invokeLater('$provide', 'constant', 'unshift'),

                // Bitsurf shorthand methods
                device: invokeLater('$deviceProvider', 'register'),

                config: config,
                run: function(block) {
                    runBlocks.push(block);
                    return this;
                }
            };

            if (configFn) {
                config(configFn);
            }

            return moduleInstance;

            function invokeLater(provider, method, insertMethod, queue) {
                if (!queue) queue = invokeQueue;
                return function() {
                    queue[insertMethod || 'push']([provider, method, arguments]);
                    return moduleInstance;
                };
            }
        });
    };
});

})(bitsurf);
