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
			i++;
			return this.next(arg);
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

exports["test EventManager.negotiate vs EventManager.emit"] = function(test) {
	test.expect(2 + 2);

	var manager = new EventManager();
	manager.on('event that does not exist', function() {
		test.ok(true, "event emitted twice");
	});
	
	test.doesNotThrow(function() {
		manager.emit('event that does not exist');
	});
	
	test.throws(function() {
		manager.negotiate('event that does not exist');
	})
	
	test.done();
};
