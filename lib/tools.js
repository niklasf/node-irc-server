/*
 * Merges any amount of objects with the first.
 */
 
exports.merge = function () {
	var i, key;
	
	if (arguments.length === 0) {
		return { };
	}
	
	for (i = arguments.length; i > 0; i -= 1) {
		for (key in arguments[i]) {
			if (arguments[i].hasOwnProperty(key)) {
				arguments[0][key] = arguments[i][key];
			}
		}
	}
	
	return arguments[0];
};

/*
 * Get the current unixtime
 */

exports.unixtime = function () {
	return parseInt(new Date().getTime() / 1000, 10);
};

/*
 * Get the current timestamp
 */

exports.timestamp = function () {
	// TODO: Implement
	return exports.unixtime();
};

/*
 * Find out if an Array contains all the given objects
 */

Array.prototype.contains = function () {
	for (var i = 0; i < arguments.length; i += 1) {
		if (this.indexOf(arguments[i]) === -1) {
			return false;
		}
	}
	return true;
};

/*
 * Remove all given objects from an array
 */

Array.prototype.remove = function () {
	var result = this.slice(0, this.length), // Copy the array
		i, index;
	
	// Splice the requested objects out
	for (i = 0; i < arguments.length; i += 1) {
		index = result.indexOf(arguments[i]);
		if (index !== -1) {
			result.splice(index, 1);
		}
	}
	
	return result;
};

/*
 * Filter the array to only contain unique elements
 */

Array.prototype.unique = function () {
	var hashmap = { },
		result = [],
		i, key;
	
	for (i = 0; i < this.length; i += 1) {
		hashmap[this[i]] = true;
	}
	
	for (key in hashmap) {
		if (hashmap.hasOwnProperty(key)) {
			result.push(key);
		}
	}
	
	return result;
};

/*
 * Converts a string to scandinavian lowercase.
 * This is required because of IRC's scandinavian origin.
 */

String.prototype.toScandinavianLowerCase = function () {
	var brackets = this.toLowerCase().replace('[', '{').replace(']', '}');
	return brackets.replace('\\', '|').replace('~', '^');
};
