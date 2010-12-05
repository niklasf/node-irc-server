var EventManager = require('../lib/eventmanager').EventManager;

exports["test override behaviour"] = function(test) {
	test.expect(2 + 1 + 2 + 2);

	var manager = new EventManager();
	
	manager.on('test', function(arg) {
		test.equals(arg, 'arg', "test event occured with right arg");
	});
	
	manager.default('test', function(arg) {
		test.equals(arg, 'arg', "called once with the right arg");
		return false;
	});
	
	var i = 0;
	manager.override('test', function(arg) {
		test.equals(arg, 'arg', "called twice");
		if(i === 0) {
			return next();
			i++;
		} else {
			return true;
		}
	});
	
	test.strictEqual(manager.emit('test', 'arg'), false,
			"overridden test passes to default");
	test.strictEqual(manager.emit('test', 'arg'), true,
			"overridden test answers itself");
	
	test.done();
};
