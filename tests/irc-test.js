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

exports["unregistered quit"] = function(test) {
	test.expect(2);

	var server = irc.createServer();
	
	var client = new EventEmitter();
	client.deliver = function(from, command, params) {
		test.equals(command, 'ERROR');
	};
	client.end = function() {
		test.ok(true, 'Connection closed');
	};
	server.addClient(client);
	
	client.emit('message', 'QUIT :See you');

	test.done();
};

exports["authenticate"] = function(test) {
	test.expect(3);
	
	var server = irc.createServer();
	
	var client = new EventEmitter();
	
	var recieved = [];
	client.deliver = function(from, command, args) {
		recieved.push(command.toString());
	};
	
	server.addClient(client);
	
	client.emit('message', 'USER username hostname servername :realname');
	client.emit('message', 'NICK nick');
	
	test.ok(client.registered, 'Client registered');
	test.ok(recieved.contains('001', '002', '003', '004'), 'Welcome recieved');
	test.ok(recieved.contains('375', '372', '376'), 'Message of the day');

	test.done();
};
