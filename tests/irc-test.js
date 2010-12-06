var irc = require('../lib/irc'),
	EventEmitter = require('events').EventEmitter;

exports["test as network server"] = function(test) {
	test.expect(0);
	
	var server = irc.createServer();
	server.listen(7834, '127.0.0.1', test.done);
};

exports["ping the server"] = function(test) {
	test.expect(3);

	var server = irc.createServer();
	
	var client = new EventEmitter();
	
	client.deliver = function(from, command, args) {
		test.equals(from, server.name, 'back from server');
		test.equals(command, 'PONG', 'sent PONG');
		test.deepEqual(args, [server.name, 'test']);
	};
	
	server.addClient(client);
	
	client.emit('message', 'PING :test');
	
	test.done();
};
