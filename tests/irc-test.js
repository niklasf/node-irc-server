var irc = require('../lib/irc');

exports["test as event manager capabilities"] = function(test) {
	test.expect(2);

	var server = irc.createServer();
	
	server.on('event', function() {
		test.ok(true, 'event occured');
	});
	
	server.default('event', function() {
		test.ok(true, 'default implementation called');
	});
	
	server.emit('event');
	
	test.done();
};

exports["test as network server"] = function(test) {
	test.expect(0);
	
	var server = irc.createServer();
	server.listen(7834, '127.0.0.1', test.done);
};
