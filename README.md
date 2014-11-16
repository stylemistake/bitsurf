# Bitsurf

Bitsurf is a framework for Bitwig Studio control surface scripts based on
custom port of AngularJS.


## Status

Core of the framework works pretty well, although it doesn't provide any
services yet, so you have to bootstrap it manually and use it any way you
want.

Enjoy the magic of dependency injection! :)


## Sample code

```
load('vendor/bitsurf/bitsurf.js');

// Define controller metadata
host.defineController(
    'Generic', 'Bitsurf Sandbox',
    '0.0.1', '90af2630-6c62-11e4-9803-0800200c9a66'
);
host.defineMidiPorts(0, 0);


// Bootstrap module
bitsurf.onInit(function (){
    bitsurf.bootstrap(['sandbox']);
});


// Define module
var sandbox = bitsurf.module('sandbox', [])
    .config(function () {
        bitsurf.log("Executing module config");
    })
    .factory('TestFactory', function () {
        bitsurf.log("Instantiating factory");
        return function() {
            bitsurf.log("Called factory");
        };
    })
    .service('TestService', function () {
        this.foo = function (x) {
            bitsurf.log("Hello World, " + x);
        }
        bitsurf.log("Instantiating service");
    })
    .run(function (TestFactory, TestService) {
        bitsurf.log("IT'S WORKING!!!");
        TestFactory();
        TestService.foo("#angularjs ftw!");
    });
```


## Contacts

Email: stylemistake@gmail.com

Web: [stylemistake.com](http://stylemistake.com)
