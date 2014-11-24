(function (bitsurf, module) {

module.provider('$preferences', function ($injector) {

    function Preferences() {
        var prefs = host.getPreferences(),
            prefsStorage = {};

        this.create = function (key, prefsObj) {
            if (bitsurf.isString(key)) {
                if (!prefsStorage.hasOwnProperty(key)) {
                    prefsStorage[key] = new Setting(prefsObj, prefs);
                }
                return prefsStorage[key];
            } else if (bitsurf.isObject(key)) {
                return new Setting(key, prefs);
            }
            return this;
        };

        this.observe = function (key, fn) {
            var setting = this.get(key);
            // TODO: observe shit
        };

        this.get = function (key) {
            return prefsStorage[key];
        };
    }

    function Setting(obj, prefs) {
        var self = this;

        if (!obj.type) {
            throw Error("$preferences: setting type is not defined");
        }

        this.type = obj.type;
        this.label = obj.label || '';

        if (obj.value) {
            this.initialValue = this.value = obj.value;
        }

        if (obj.category) {
            this.category = obj.category || null;
        }

        if (this.type === "enum") {
            this.valueObj = prefs.getEnumSetting(
                this.label, this.category,
                this.options = obj.options,
                this.initialValue = this.initialValue || 0
            );
            this.valueObj.addValueObserver(function (value) {
                self.value = value;
            });
        } else
        if (this.type === "number") {
            this.valueObj = prefs.getNumberSetting(
                this.label, this.category,
                this.minValue = obj.minValue || 0,
                this.maxValue = obj.maxValue || 0xff,
                this.stepResolution = obj.stepResolution || 1,
                this.unit = obj.unit || '',
                this.initialValue = this.initialValue || 0
            );
            this.valueObj.addRawValueObserver(function (value) {
                self.value = value;
            });
        } else
        if (this.type === "signal") {
            this.valueObj = prefs.getSignalSetting(
                this.label, this.category,
                this.action = obj.action
            );
        } else
        if (this.type === "string") {
            this.valueObj = prefs.getStringSetting(
                this.label, this.category,
                this.numChars = obj.numChars || 0xff,
                this.initialValue = this.initialValue || ''
            );
            this.valueObj.addValueObserver(function (value) {
                self.value = value;
            });
        } else {
            throw Error("$preferences: Type '" + this.type + "' is not supported");
        }

        if (bitsurf.isFunction(obj.observer)) {
            this.observe(obj.observer);
        }
    }

    Setting.prototype.getValueObj = function (fn) {
        return this.valueObj;
    };

    Setting.prototype.observe = function (fn) {
        if (bitsurf.isFunction(fn)) {
            if (this.type === "enum" || this.type === "string") {
                this.valueObj.addValueObserver(fn);
            } else
            if (this.type === "signal") {
                this.valueObj.addSignalObserver(fn);
            } else
            if (this.type === "number") {
                this.valueObj.addRawValueObserver(fn);
            }
        } else {
            throw Error("$preferences: observer is not a function");
        }
        return this;
    };

    return {
        $get: function () {
            return new Preferences();
        }
    };
    
});

})(bitsurf, bitsurf.module('bitsurf'));
