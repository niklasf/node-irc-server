exports.merge = function(first, secound) {
	for(var key in secound) {
		first[key] = secound[key];
	}
	return first;
};
