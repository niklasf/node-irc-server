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

exports["array contains"] = function(test) {
	test.expect(5 + 4 + 2 + 2);

	var one = [1, 2, 3, 4, 5];
	var two = ['one', 'two', 'three', 'four', 'five'];
	
	test.ok(one.contains(2));
	test.ok(one.contains(4, 5));
	test.ok(one.contains(5, 4));
	test.ok(one.contains(4, 4));
	test.ok(one.contains(1, 2, 3, 4, 5));
	
	test.ok(!one.contains('1'), 'strict equal');
	test.ok(!one.contains(one));
	test.ok(!one.contains('12'));
	test.ok(!one.contains(1, 2, 3, 100));
	
	test.ok(two.contains('two'));
	test.ok(two.contains('four', 'one'));
	
	test.ok(!two.contains('two', 'three', 'anything'));
	test.ok(!two.contains(two));
	
	test.done();
};

exports["array delete"] = function(test) {
	test.expect(5 + 1);
	
	var array = ['one', 'two', 'three', 1, 2, 3];
	
	test.deepEqual(array.remove('one'), ['two', 'three', 1, 2, 3]);
	test.deepEqual(array.remove('one', 'two'), ['three', 1, 2, 3]);
	test.deepEqual(array.remove('nothing', 'really not'), array);
	test.deepEqual(array.remove(1, 2, 3), ['one', 'two', 'three']);
	test.deepEqual(array.remove('three', 'nothing'), ['one', 'two', 1, 2, 3]);
	
	test.deepEqual(array, ['one', 'two', 'three', 1, 2, 3]);
	
	test.done();
};

exports["scandinavian case conversion"] = function(test) {
	test.expect(3);

	test.strictEqual("{}|^".toScandinavianLowerCase(), '{}|^');
	test.strictEqual("\\[]~".toScandinavianLowerCase(), '|{}^');
	test.strictEqual(
			"Any text \t in [scandi]~LowerCase \\ lg".toScandinavianLowerCase(),
			"any text \t in {scandi}^lowercase | lg");
	
	test.done();
};
