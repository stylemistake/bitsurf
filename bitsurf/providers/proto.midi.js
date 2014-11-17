(function (bitsurf, module) {

// $proto.midi
// Midi protocol provider
module.config(function ($protoProvider, $streamProvider) {

    // ------------------------------------------------------------------
    //  MidiStream
    // ------------------------------------------------------------------

    var Stream = $streamProvider.$get();

    function MidiStream(parent) {
        this.ports = [];
        Stream.call(this, parent);
    };

    bitsurf.extend(MidiStream.prototype, Stream.prototype);

    MidiStream.prototype.setMidiInPort = function (port) {
        var self = this,
            midiIn = host.getMidiInPort(port);
        try {
            // Add callback to feed messages to stream
            midiIn.setMidiCallback(function (a, b, c) {
                var m = new MidiMessage(a, b, c);
                m.port = port;
                self.push(m);
            });
            // Save port in array for later use
            this.ports.push(port);
        } catch (e) {
            host.errorln("MidiStream: Couldn't add midi port.");
            host.errorln(e);
            host.errorln(
                "MidiStream: It is possible, that you've assigned a greater " + 
                "port than available in BWS settings. Try restarting the DAW."
            );
        }
    };

    MidiStream.prototype.send = function (status, data1, data2) {
        if (status instanceof MidiMessage) {
            this.push(status);
        } else {
            this.push(new MidiMessage(status, data1, data2));
        }
    };



    // ------------------------------------------------------------------
    //  MidiMessage
    // ------------------------------------------------------------------

    // MidiMessage constructor
    function MidiMessage(status, data1, data2) {
        // Apply message props to object
        // Missing parts are lazily calculated via prototype getters and setters
        if (typeof status === "object") {
            var self = this;
            bitsurf.forEach(status, function (value, key) {
                self[key] = status[value];
            });
        } else {
            this.status = status;
            this.data1 = data1;
            this.data2 = data2;
        }
    }

    // MidiMessage virtual properties
    // msg.type
    bitsurf.defineGetter(
        MidiMessage.prototype, "type",
        function () {
            if (this.isNote()) return "note";
            if (this.isControl()) return "cc";
            if (this.isProgramChange()) return "pc";
            if (this.isKeyPressure()) return "kp";
            if (this.isChannelPressure()) return "kp";
            if (this.isPitchbend()) return "pb";
            return null;
        }
    );

    // msg.channel
    bitsurf.defineGetter(MidiMessage.prototype, "channel",
        function() {
            return ( this.status & 0x0F ) + 1;
        }
    );
    bitsurf.defineSetter(MidiMessage.prototype, "channel",
        function(value) {
            this.status = ( this.status & 0xF0 ) + value - 1;
        }
    );

    // msg.relvalue
    bitsurf.defineGetter(MidiMessage.prototype, "relvalue",
        function() {
            return ( this.data2 < 0x40 ? this.data2 : this.data2 - 0x80 );
        }
    );
    bitsurf.defineSetter(MidiMessage.prototype, "relvalue",
        function(value) {
            this.data2 += value;
            this.data2 &= 0x7F;
        }
    );

    // msg.cc
    bitsurf.definePropertyLink(MidiMessage.prototype, "cc", "data1");

    // msg.note
    bitsurf.definePropertyLink(MidiMessage.prototype, "note", "data1");

    // msg.value
    bitsurf.definePropertyLink(MidiMessage.prototype, "value", "data1");

    // msg.velocity
    bitsurf.definePropertyLink(MidiMessage.prototype, "velocity", "data1");

    // MidiMessage methods
    MidiMessage.prototype.inRange = function (prop, a, b) {
        var value = this[prop];
        return ( value >= a ) && ( value <= b );
    };

    MidiMessage.prototype.toHex = function (prop) {
        if (prop) {
            var upper = ( this.valueOf() >> 4 ) & 0x0F,
                lower = this.valueOf() & 0x0F;
            return upper.toString( 16 ) + lower.toString( 16 );
        } else {
            return this.toHex('status') +
                this.toHex('data1') +
                this.toHex('data2');
        }
    };

    MidiMessage.prototype.isValid = function () {
        return !( isNaN(this.status) && isNaN(this.data1) && isNaN(this.data2) );
    };

    MidiMessage.prototype.isNote = function () {
        return this.inRange('status', 0x80, 0x9f);
    };

    MidiMessage.prototype.isNoteOff = function () {
        return this.inRange('status', 0x80, 0x8f);
    };

    MidiMessage.prototype.isNoteOn = function () {
        return this.inRange('status', 0x90, 0x9f);
    };

    MidiMessage.prototype.isKeyPressure = function () {
        return this.inRange('status', 0xa0, 0xaf);
    };

    MidiMessage.prototype.isControlChange = function () {
        return this.inRange('status', 0xb0, 0xbf);
    };

    MidiMessage.prototype.isProgramChange = function () {
        return this.inRange('status', 0xc0, 0xcf);
    };

    MidiMessage.prototype.isChannelPressure = function () {
        return this.inRange('status', 0xd0, 0xdf);
    };

    MidiMessage.prototype.isPitchbend = function () {
        return this.inRange('status', 0xe0, 0xef);
    };

    MidiMessage.prototype.isAftertouch = function () {
        return this.isKeyPressure() || this.isChannelPressure();
    };

    MidiMessage.prototype.toString = function() {
        if (!this.isValid()) {
            return "Invalid MIDI message";
        }
        var s = "MIDI: ";
        if ( this.port !== undefined ) {
            s += "p" + this.port + " ";
        }
        s += this.status + " " + this.data1 + " " + this.data2 + ", ";
        s += "[" + this.toHex() + "]";
        return s;
    };

    MidiMessage.prototype.toHashString = function() {
        return "m" + this.status + this.data1;
    };



    // ------------------------------------------------------------------
    //  Protocol constructor
    // ------------------------------------------------------------------

    var portsInCounter = 0,
        portsOutCounter = 0;

    $protoProvider.register('midi', function (config) {
        var inputStream = MidiStream(),
            outputStream = MidiStream();
        if (!bitsurf.isObject(config)) {
            throw TypeError('Configuration object expected');
        }

        var portsIn = config.portsIn,
            portsOut = config.portsOut;

        if (bitsurf.isNumber(portsIn)) {
            for (var i = 0; i < portsIn; i += 1) {
                input.setMidiInPort(portsInCounter + i);
            }
            portsInCounter += portsIn;
        }

        if (bitsurf.isNumber(portsOut)) {
            for (var i = 0; i < portsOut; i += 1) {
                output.ports.push(portsOutCounter + i);
            }
            portsOutCounter += portsOut;
        }

        host.defineMidiPorts(portsInCounter, portsOutCounter);

        return {
            input: inputStream,
            output: outputStream,
            config: config
        };
    });

});

})(bitsurf, bitsurf.module('bitsurf'));
