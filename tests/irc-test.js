var irc = require('../lib/irc'),
	EventEmitter = require('events').EventEmitter;

exports["test as network server"] = function (test) {
	test.expect(0);
	
	var server = irc.createServer();
	server.listen(7834, '127.0.0.1', test.done);
};

exports["ping the server"] = function (test) {
	test.expect(3);

	var server = irc.createServer(),
		client = new EventEmitter();
	
	client.deliver = function (from, command, args) {
		test.equals(from, server.name, 'back from server');
		test.equals(command, 'PONG', 'sent PONG');
		test.deepEqual(args, [server.name, 'test']);
	};
	
	server.addClient(client);
	
	client.emit('message', 'PING :test');
	
	test.done();
};

exports["unregistered quit"] = function (test) {
	test.expect(2);

	var server = irc.createServer(),
		client = new EventEmitter();
	
	client.deliver = function (from, command, params) {
		test.equals(command, 'ERROR');
	};
	
	client.end = function () {
		test.ok(true, 'Connection closed');
	};
	
	server.addClient(client);
	
	client.emit('message', 'QUIT :See you');

	test.done();
};

exports["authenticate a client"] = function (test) {
	test.expect(3);
	
	var server = irc.createServer(),
		client = new EventEmitter(),
		recieved = [];
	
	client.deliver = function (from, command, args) {
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

exports["presence of options"] = function (test) {
	test.expect(7 + 2);

	var server = irc.createServer();
	
	test.notStrictEqual(server.name, undefined);
	test.notStrictEqual(server.ip, undefined);
	test.notStrictEqual(server.port, undefined);
	test.notStrictEqual(server.version, undefined);
	test.notStrictEqual(server.creation, undefined);
	test.notStrictEqual(server.usermodes, undefined);
	test.notStrictEqual(server.channelmodes, undefined);
	
	test.notStrictEqual(server.motd, undefined);
	test.ok(Array.isArray(server.motd));
	
	test.done();
};

exports["test registered quit"] = function (test) {
	test.expect(5);
	
	var server = irc.createServer(),
		client = new EventEmitter();
	
	client.deliver = function (from, command, args) {
		if (command.toString() === 'QUIT') {
			test.equals(from, 'nickThatIsNotInUse!abc', 'from valid');
			test.strictEqual(args.length, 1, 'reason given');
		}
	};
	
	client.end = function () {
		test.ok('Connection closed');
	};
	
	server.addClient(client);
	client.emit('message', 'NICK nickThatIsNotInUse');
	client.emit('message', 'USER abc abc abc abc');
	
	test.equals(client.name, 'nickThatIsNotInUse', 'Nickname applied');
	test.ok(client.registered, 'Client registered');
	
	client.emit('message', 'QUIT :bye');
	
	test.done();
};

exports["test private messaging"] = function (test) {
	test.expect(1 + 1 + 1 + 4 * 2);
	
	var server = irc.createServer(),
		alice = new EventEmitter(),
		bob = new EventEmitter(),
		ignore = function () { };
	
	server.addClient(alice);
	alice.deliver = ignore;
	alice.emit('message', 'NICK alice');
	alice.emit('message', 'USER abc abc abc abc');
	test.ok(alice.registered, 'Alice registered');
	
	alice.deliver = function (from, command, args) {
		test.equals(command, 401, 'No such nick');
	};
	alice.emit('message', 'PRIVMSG bob :Hello bob');
	
	server.addClient(bob);
	bob.deliver = ignore;
	bob.emit('message', 'NICK boB');
	bob.emit('message', 'USER abc abc abc abc');
	test.ok(bob.registered, 'Bob registered');
	
	// (Called twice for bob and alice)
	bob.deliver = function (from, command, args) {
		test.equals(from, 'alice!abc');
		test.equals(command, 'PRIVMSG');
		test.equals(args[0].toScandinavianLowerCase(), 'bob');
		test.equals(args[1], 'Hi there!');
	};
	alice.deliver = function (from, command, args) {
		test.equals(from, 'alice!abc');
		test.equals(command, 'PRIVMSG');
		test.equals(args[0].toScandinavianLowerCase(), 'alice');
		test.equals(args[1], 'Hi there!');
	};
	alice.emit('message', 'PRIVMSG Bob,aLice :Hi there!');
	
	test.done();
};

exports["test away message"] = function (test) {
	test.expect(2 + 1 + 1 + 1 + 5 + 1);
	
	var server = irc.createServer(),
		alice = new EventEmitter(),
		bob = new EventEmitter(),
		ignore = function () { };
	
	server.addClient(bob);
	bob.deliver = ignore;
	bob.emit('message', 'NICK bob');
	bob.emit('message', 'USER abc abc abc abc');
	test.ok(bob.registered, 'Bob registered');
	
	bob.deliver = function (from, command, args) {
		test.equals(command, 306, 'Bob has been marked as beeing away');
	};
	bob.emit('message', 'AWAY :brb');
	test.equals(bob.away, 'brb');
	
	server.addClient(alice);
	alice.deliver = ignore;
	alice.emit('message', 'NICK alice');
	alice.emit('message', 'USER abc abc abc abc');
	test.ok(alice.registered, 'Alice registered');
	
	bob.deliver = function (from, command, args) {
		test.equals(command, 'PRIVMSG');
	};
	alice.deliver = function (from, command, args) {
		test.equals(from, server.name);
		test.equals(command, 301);
		test.equals(args[0], 'alice');
		test.equals(args[1], 'bob');
		test.equals(args[2], 'brb');
	};
	alice.emit('message', 'PRIVMSG bob :how are you?');
	
	bob.deliver = ignore;
	bob.emit('message', 'AWAY');
	test.strictEqual(bob.away, undefined);
	
	test.done();
};

exports["survice connection error"] = function (test) {
	test.expect(2);
	
	var server = irc.createServer(),
		client = new EventEmitter();
	
	test.throws(function () {
		client.emit('error', 'May this be fatal');
	});
	
	server.addClient(client);
	test.doesNotThrow(function () {
		client.emit('error', 'This should not be fatal');
	});
	
	test.done();
};

exports["try to join channel without # or &"] = function (test) {
	test.expect(1 + 4);

	var server = irc.createServer(),
		client = new EventEmitter(),
		ignore = function () { };
	
	server.addClient(client);
	client.deliver = ignore;
	client.emit('message', 'USER abc abc abc abc');
	client.emit('message', 'NICK client');
	test.ok(client.registered);
	
	client.deliver = function (from, command, args) {
		test.equals(command, 403, 'No such channel');
		test.equals(args[0], 'client');
		test.equals(args[1], 'test');
		test.equals(args[2], 'No such channel');
	};
	client.emit('message', 'JOIN test');
	
	test.done();
};

exports["join a channel list"] = function (test) {
	test.expect(1 + 1);

	var server = irc.createServer(),
		client = new EventEmitter(),
		ignore = function () { },
		channels = [];
	
	server.addClient(client);
	client.deliver = ignore;
	client.emit('message', 'USER abc abc abc abc');
	client.emit('message', 'NICK client');
	test.ok(client.registered);
	
	client.deliver = function (from, command, args) {
		if (command === 'JOIN') {
			channels.push(args[0]);
		}
	};
	client.emit('message', 'JOIN #first,#secound,#third firstPassPhrase');
	test.deepEqual(channels, '#first', '#secound', '#third');
	
	test.done();
};

exports["check welcome messages when joining a channel"] = function (test) {
	test.expect(1 + 4);
	
	var server = irc.createServer(),
		client = new EventEmitter(),
		ignore = function () { },
		commands = [];
	
	server.addClient(client);
	client.deliver = ignore;
	client.emit('message', 'USER abc abc abc abc');
	client.emit('message', 'NICK client');
	test.ok(client.registered);
	
	client.deliver = function (from, command, args) {
		commands.push(command.toString());
	};
	client.emit('message', 'JOIN #channel');
	
	test.ok(commands.contains('JOIN'), 'JOIN command');
	test.ok(commands.contains('332'), 'RPL_TOPIC');
	test.ok(commands.contains('353'), 'RPL_NAMREPLY');
	test.ok(commands.contains('366'), 'RPL_ENDOFNAMES');
	
	test.done();
};

exports["test presence of sepcial message JOIN 0"] = function (test) {
	test.expect(1 + 2);
	
	var server = irc.createServer(),
		client = new EventEmitter(),
		ignore = function () { },
		commands = [];
	
	server.addClient(client);
	client.deliver = ignore;
	client.emit('message', 'USER abc abc abc abc');
	client.emit('message', 'NICK client');
	test.ok(client.registered);
	
	client.deliver = function (from, command, args) {
		commands.push(command.toString());
	};
	client.emit('message', 'JOIN #channel,0');
	
	test.ok(commands.contains('JOIN'), 'joined a channel');
	test.ok(commands.contains('PART'), '0 parts all channels');
	
	test.done();
};
