(function (bitsurf) {

// Import public Bitsurf API
var forEach = bitsurf.forEach,
    HashMap = bitsurf.HashMap,
    fnParams = bitsurf.fnParams,
    isArray = bitsurf.isArray,
    isString = bitsurf.isString,
    isObject = bitsurf.isObject,
    isFunction = bitsurf.isFunction,
    isUndefined = bitsurf.isUndefined,
    assertArgFn = bitsurf.assertArgFn,
    assertNotHasOwnProperty = bitsurf.assertNotHasOwnProperty;


// Annotates function with dependencies.
// Uses reflection or normal dependency declarations.
function annotate(fn) {
    var $inject, last;
    if (typeof fn === 'function') {
        if (!($inject = fn.$inject)) {
            $inject = [];
            if (fn.length) {
                forEach(fnParams(fn), function (arg) {
                    $inject.push(arg);
                });
            }
            fn.$inject = $inject;
        }
    } else if (isArray(fn)) {
        last = fn.length - 1;
        assertArgFn(fn[last], 'fn');
        $inject = fn.slice(0, last);
    } else {
        assertArgFn(fn, 'fn', true);
    }
    return $inject;
}



// ------------------------------------------------------------------
//  Injector constructor
// ------------------------------------------------------------------

function createInjector(modulesToLoad, strictDi) {
    strictDi = (strictDi === true);
    var INSTANTIATING = {},
        providerSuffix = 'Provider',
        path = [],
        loadedModules = new HashMap([], true),
        providerCache = {
            $provide: {
                provider: supportObject(provider),
                factory: supportObject(factory),
                service: supportObject(service),
                value: supportObject(value),
                constant: supportObject(constant),
                decorator: decorator
            }
        },
        providerInjector = (providerCache.$injector =
            createInternalInjector(providerCache, function() {
                throw Error("Unknown provider: " + path.join(' <- '));
            })),
        instanceCache = {},
        instanceInjector = (instanceCache.$injector =
            createInternalInjector(instanceCache, function(servicename) {
                var provider = providerInjector.get(servicename + providerSuffix);
                return instanceInjector.invoke(provider.$get, provider, undefined, servicename);
            }));

    forEach(loadModules(modulesToLoad), function(fn) {
        instanceInjector.invoke(fn || noop);
    });

    return instanceInjector;

    // ------------------------------------------------------------------
    //  Provider
    // ------------------------------------------------------------------

    function supportObject(delegate) {
        return function(key, value) {
            if (isObject(key)) {
                forEach(key, reverseParams(delegate));
            } else {
                return delegate(key, value);
            }
        };
    }

    function provider(name, provider_) {
        assertNotHasOwnProperty(name, 'service');
        if (isFunction(provider_) || isArray(provider_)) {
            provider_ = providerInjector.instantiate(provider_);
        }
        if (!provider_.$get) {
            throw Error("Provider '" + name + "' must define $get factory method.");
        }
        return providerCache[name + providerSuffix] = provider_;
    }

    function enforceReturnValue(name, factory) {
        return function enforcedReturnValue() {
            var result = instanceInjector.invoke(factory, this, undefined, name);
            if (isUndefined(result)) {
                throw Error("Provider '" + name + "' must return a value from $get factory method.");
            }
            return result;
        };
    }

    function factory(name, factoryFn, enforce) {
        return provider(name, {
            $get: enforce !== false ? enforceReturnValue(name, factoryFn) : factoryFn
        });
    }

    function service(name, constructor) {
        return factory(name, ['$injector', function($injector) {
            return $injector.instantiate(constructor);
        }]);
    }

    function value(name, val) { return factory(name, valueFn(val), false); }

    function constant(name, value) {
        assertNotHasOwnProperty(name, 'constant');
        providerCache[name] = value;
        instanceCache[name] = value;
    }

    function decorator(serviceName, decorFn) {
        var origProvider = providerInjector.get(serviceName + providerSuffix),
            orig$get = origProvider.$get;
        origProvider.$get = function() {
            var origInstance = instanceInjector.invoke(orig$get, origProvider);
            return instanceInjector.invoke(decorFn, null, {$delegate: origInstance});
        };
    }



    // ------------------------------------------------------------------
    //  Module loading
    // ------------------------------------------------------------------

    function loadModules(modulesToLoad) {
        var runBlocks = [], moduleFn;
        forEach(modulesToLoad, function(module) {
            if (loadedModules.get(module)) return;
            loadedModules.put(module, true);

            function runInvokeQueue(queue) {
                var i, ii;
                for (i = 0, ii = queue.length; i < ii; i++) {
                    var invokeArgs = queue[i],
                        provider = providerInjector.get(invokeArgs[0]);
                    provider[invokeArgs[1]].apply(provider, invokeArgs[2]);
                }
            }

            try {
                if (isString(module)) {
                    moduleFn = bitsurf.module(module);
                    runBlocks = runBlocks.concat(loadModules(moduleFn.requires)).concat(moduleFn._runBlocks);
                    runInvokeQueue(moduleFn._invokeQueue);
                    runInvokeQueue(moduleFn._configBlocks);
                } else if (isFunction(module)) {
                    runBlocks.push(providerInjector.invoke(module));
                } else if (isArray(module)) {
                    runBlocks.push(providerInjector.invoke(module));
                } else {
                    assertArgFn(module, 'module');
                }
            } catch (e) {
                if (isArray(module)) {
                    module = module[module.length - 1];
                }
                var reason = e.stack || e.message || e;
                throw Error("Failed to instantiate module '" + module
                    + "' due to:\n" + reason);
            }
        });
        return runBlocks;
    }



    // ------------------------------------------------------------------
    //  Internal Injector
    // ------------------------------------------------------------------

    function createInternalInjector(cache, factory) {

        function getService(serviceName) {
            if (cache.hasOwnProperty(serviceName)) {
                if (cache[serviceName] === INSTANTIATING) {
                    throw Error('Circular dependency found: ' + serviceName + ' <- ' + path.join(' <- '));
                }
                return cache[serviceName];
            } else {
                try {
                    path.unshift(serviceName);
                    cache[serviceName] = INSTANTIATING;
                    return cache[serviceName] = factory(serviceName);
                } catch (err) {
                    if (cache[serviceName] === INSTANTIATING) {
                        delete cache[serviceName];
                    }
                    throw err;
                } finally {
                    path.shift();
                }
            }
        }

        function invoke(fn, self, locals, serviceName) {
            if (typeof locals === 'string') {
                serviceName = locals;
                locals = null;
            }

            var args = [],
                $inject = annotate(fn, strictDi, serviceName),
                length, i,
                key;

            for (i = 0, length = $inject.length; i < length; i++) {
                key = $inject[i];
                if (typeof key !== 'string') {
                    throw Error('Incorrect injection token! Expected service name as string, got ' + key);
                }
                args.push(
                    locals && locals.hasOwnProperty(key)
                    ? locals[key]
                    : getService(key)
                );
            }
            if (isArray(fn)) {
                fn = fn[length];
            }

            // http://jsperf.com/angularjs-invoke-apply-vs-switch
            // #5388
            return fn.apply(self, args);
        }

        function instantiate(Type, locals, serviceName) {
            var Constructor = function() {},
                instance, returnedValue;

            // Check if Type is annotated and use just the given function at n-1 as parameter
            // e.g. someModule.factory('greeter', ['$window', function(renamed$window) {}]);
            Constructor.prototype = (isArray(Type) ? Type[Type.length - 1] : Type).prototype;
            instance = new Constructor();
            returnedValue = invoke(Type, instance, locals, serviceName);

            return isObject(returnedValue) || isFunction(returnedValue) ? returnedValue : instance;
        }

        return {
            invoke: invoke,
            instantiate: instantiate,
            get: getService,
            annotate: annotate,
            has: function(name) {
                return providerCache.hasOwnProperty(name + providerSuffix) || cache.hasOwnProperty(name);
            }
        };
    }
}

createInjector.$$annotate = annotate;

bitsurf.injector = createInjector;

})(bitsurf);
