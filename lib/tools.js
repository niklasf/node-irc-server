/*
 * Merges any amount of objects with the first.
 */
 
exports.merge = function() {
	if(arguments.length === 0) {
		return { };
	}
	
	for(var i = arguments.length; i > 0; i--) {
		for(var key in arguments[i]) {
			arguments[0][key] = arguments[i][key];
		}
	}
	
	return arguments[0];
};

/*
 * Get the current unixtime
 */

exports.unixtime = function() {
	return parseInt(new Date().getTime() / 1000);
};

/*
 * Find out if an Array contains all the given objects
 */

Array.prototype.contains = function() {
	for(var i = 0; i < arguments.length; i++) {
		if(this.indexOf(arguments[i]) === -1) {
			return false;
		}
	}
	return true;
};

/*
 * Remove all given objects from an array
 */

Array.prototype.remove = function() {
	// Copy the array
	var result = this.slice(0, this.length);
	
	// Splice the requested objects out
	for(var i = 0; i < arguments.length; i++) {
		var index = result.indexOf(arguments[i]);
		if(index !== -1) {
			result.splice(index, 1);
		}
	}
	
	return result;
};

/*
 * Converts a string to its scandinavian lowercase.
 * This is required because of IRC's scandinavian origin.
 */

String.prototype.toScandinavianLowerCase = function() {
	return this.toLowerCase().replace('[', '{').replace(']', '}').
			replace('\\', '|').replace('~', '^');
};
