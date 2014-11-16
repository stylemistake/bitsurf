(function (bitsurf, module) {

// $proto
// Protocol service
module.provider('$proto', function () {
    var protocols = {};
    return {
        register: function (name, constructor) {
            protocols[name] = constructor;
        },
        $get: function () {
            return protocols;
        }
    };
});

})(bitsurf, bitsurf.module('bitsurf'));
