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
