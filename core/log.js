(function (bitsurf) {

// Logs a message in a console
function log() {
    bitsurf.sliceArgs(arguments).forEach(function (arg) {
        host.println(arg);
    });
    return bitsurf;
}

// Logs a message in a console with bitsurf prefix
function logInternal() {
    bitsurf.sliceArgs(arguments).forEach(function (arg) {
        host.println("bitsurf: " + arg);
    });
    return bitsurf;
}

bitsurf.extend(bitsurf, {
    log: log,
    $$log: logInternal
});

})(bitsurf);
