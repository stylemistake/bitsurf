var init, exit, flush;

(function (bitsurf) {

var initCallbacks = [],
    exitCallbacks = [],
    flushCallbacks = [],
    isInitCalled = false;

function invokeFn(callback) {
    (callback || bitsurf.noop)();
}

init = function () {
    isInitCalled = true;
    bitsurf.forEach(initCallbacks, invokeFn);
}
exit = function () {
    bitsurf.forEach(exitCallbacks, invokeFn);
}
flush = function () {
    bitsurf.forEach(flushCallbacks, invokeFn);
}

bitsurf.onInit = function (fn) {
    if (!isInitCalled) {
        initCallbacks.push(fn);
    } else {
        invokeFn(fn);
    }
    return bitsurf;
}

bitsurf.onExit = function (fn) {
    exitCallbacks.push(fn);
    return bitsurf;
}

bitsurf.onFlush = function (fn) {
    flushCallbacks.push(fn);
    return bitsurf;
}

})(bitsurf);
