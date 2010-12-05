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
