(function (bitsurf) {

var tab = '    ',
    depthLimit = 10;

function getTabs(depth) {
    var str = '', i;
    for (i = 0; i < depth; i += 1) {
        str += tab;
    }
    return str;
}

function getStrRepr(obj, depth) {
    var str = '';
    if (!depth) {
        depth = 0;
    }
    if (bitsurf.isString(obj) ||
        bitsurf.isNumber(obj) ||
        bitsurf.isUndefined(obj) ||
        bitsurf.isBoolean(obj)) {
        return obj;
    }
    if (bitsurf.isFunction(obj)) {
        str += bitsurf.anonFnStr(obj);
        var isEmpty = true;
        bitsurf.forEach(obj, function (value, key) {
            if (isEmpty) {
                isEmpty = false;
                str += ' ->'
            }
            str += '\n' + getTabs(depth+1);
            str += key + ': ' + getStrRepr(value, depth+1);
        });
        return str;
    }
    if (bitsurf.isArray(obj)) {
        if (depth > depthLimit) {
            return '[?]';
        }
        if (obj.length > 0) str += '[] ->';
        else str += '[]';
        bitsurf.forEach(obj, function (value, key) {
            str += '\n' + getTabs(depth+1);
            str += key + ': ' + getStrRepr(value, depth+1);
        });
        return str;
    }
    if (bitsurf.isObject(obj)) {
        if (depth > depthLimit) {
            return '{?}';
        }
        var isEmpty = true;
        bitsurf.forEach(obj, function (value, key) {
            if (isEmpty) {
                isEmpty = false;
                str += '{} ->'
            }
            str += '\n' + getTabs(depth+1);
            str += key + ': ' + getStrRepr(value, depth+1);
        });
        if (isEmpty) str += '{}';
        return str;
    }
    return obj;
}

bitsurf.extend(bitsurf, {
    // Logs a message in a console
    log: function () {
        bitsurf.sliceArgs(arguments).forEach(function (arg) {
            host.println(getStrRepr(arg));
        });
    },
    // Logs a message in a console with bitsurf prefix
    $$log: function (arg) {
        host.println("bitsurf: " + arg);
        return bitsurf;
    }
});

})(bitsurf);
