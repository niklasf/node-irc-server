var irc = require('../lib/irc'),
	EventEmitter = require('events').EventEmitter;

exports["test as network server"] = function(test) {
	test.expect(0);
	
	var server = irc.createServer();
	server.listen(7834, '127.0.0.1', test.done);
};

exports["ping the server"] = function(test) {
	test.expect(4);

	var server = irc.createServer();
	
	var client = new EventEmitter();
	
	client.deliver = function(from, to, command, args) {
		test.equals(from, server.name, 'back from server');
		test.equals(to, server.name, 'Back to the server');
		test.equals(command, 'PONG', 'sent PONG');
		test.equals(args, ['test']);
	};
	
	server.addClient(client);
	
	client.emit('message', 'PING :test');
	
	test.done();
};
