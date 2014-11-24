// --------------------------------------------------------
//  `String` polyfills
// --------------------------------------------------------

// Convert string to charcode array
String.prototype.toBytes = function () {
	var i, ii, bytes = [];
	for (i = 0, ii = this.length; i < ii; i += 1) {
		bytes.push(this.charCodeAt(i));
	}
	return bytes;
};

// Convert charcode array to string
String.fromBytes = function (bytes) {
	var i, ii, result = '';
	for (i = 0, ii = bytes.length; i < ii; i += 1) {
		result += String.fromCharCode(bytes[i]);
	}
	return result;
};
