var tools = require('../lib/tools');

exports["test object merging"] = function(test) {
	test.expect(1);

	test.deepEqual(tools.merge({
		'a': 'old',
		'b': 'old',
		'c': 'old'
	}, {
		'a': 'new',
		'd': 'new'
	}), {
		'a': 'new',
		'b': 'old',
		'c': 'old',
		'd': 'new'
	}, "merge two objects");
	
	test.done();
};

exports["get unixtime"] = function(test) {
	test.expect(2);
	test.ok(tools.unixtime() > 1291590000, 'december 06 in 2010 is over');
	test.ok(tools.unixtime() < 2000000000, 'were not *that* far in the future');
	test.done();
};
