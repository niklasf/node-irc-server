var tools = require('./tools'),
	assert = require('assert'),
	sprintf = require('sprintf').sprintf,
	EventManager = require('./eventmanager').EventManager,
	irc = require('./irc');

exports.extend = function (server) {
	/*
	 * User respectively client register
	 */
	
	// Extendable process
	
	server.register = new EventManager({
		'may use user params':
		function (client, username, hostname, servername, realname) {
			return true;
		},
		
		'validate nickname':
		function (client, nick) {
			if (!(/^[A-Za-z][A-Za-z0-9-\[\]\\`\^\{\}_]{1,19}$/.exec(nick))) {
				server.log.warn(client.remoteAddress, client.name,
						'Tried illegal nickname', nick);
				client.deliver(server.name, 432,
						[client.name, nick, 'Erroneous Nickname']);
				return false;
			} else {
				return true;
			}
		},
		
		'check nickname in use':
		function (client, nick) {
			var name = nick.toScandinavianLowerCase(),
				use = server.register.clients[name];
			
			if (use && use.name.toScandinavianLowerCase() === name) {
				client.deliver(server.name, 433,
						[client.name, nick, 'Nickname is already in use.']);
				return false;
			} else {
				return true;
			}
		},
		
		'may use nick':
		function (client, nick) {
			return true;
		},
		
		'register':
		function (client) {
			server.log.info(client.remoteAddress, client.name,
					'Client registered');
			var scand = client.name.toScandinavianLowerCase();
			if (client.registered) {
				assert.strictEqual(client, server.register.clients[scand],
				                   "Wrong client entry in server.register.clients");
				delete server.register.clients[scand];
			}
			client.registered = true;
			server.register.clients[scand] = client;
			return true;
		},
		
		'welcome user':
		function (client) {
			// Send 001 to 004
			client.deliver(server.name, '001', [client.name, sprintf(
					'Welcome to the %s Internet Relay Chat Network %s',
					server.netname, client.name)]);
			client.deliver(server.name, '002', [client.name, sprintf(
					'Your host is %s[%s/%s], running version %s',
					server.name, server.ip, server.port, server.version)]);
			client.deliver(server.name, '003', [client.name, sprintf(
					'This server was created %s',
					server.creation)]);
			client.deliver(server.name, '004', [client.name, sprintf(
					'%s %s %s %s',
					server.name, server.version, server.usermodes,
					server.channelmodes)]);
			return true;
		},
		
		'inform people of registration':
		function (client, oldNick) {
			client.deliver(oldNick + '!' + client.hostname,
					'NICK', [client.name]);
		}
	});
	
	// List of clients
	
	server.register.clients = { };

	// Register if possible

	server.register.canRegister = function (client, oldNick) {
		// Every necessary thing set
		var userSettings = client.username !== undefined &&
				client.hostname !== undefined &&
				client.servername !== undefined &&
				client.realname !== undefined,
			nickSettings = client.name !== '*',
			wasRegistered = client.registered;
		
		// Do it
		if (userSettings && nickSettings) {
			if (!server.register.negotiate('register', client)) {
				return;
			}
			
			if (wasRegistered) {
				assert.notStrictEqual(oldNick, undefined, 'was registered');
				server.register.negotiate('inform people of registration',
						client, oldNick);
			} else {
				if (!server.register.negotiate('welcome user', client)) {
					return;
				}
				server.commands.negotiate('MOTD', client);
			}
		}
	};

	/*
	 * Commands
	 */
	
	//    Command: PASS
	// Parameters: <passphrase>
	server.registrationCommands.default('PASS', function (client, pass) {
		// Check if already registered
		if (client.registered) {
			client.deliver(server.name, 462,
					[client.name, 'You may not reregister']);
			return;
		}
		
		// Validate parameter and apply
		if (pass === undefined) {
			throw 'ERR_NEEDMOREPARAMS';
		}
		client.password = pass;
	});
	
	//    Command: USER
	// Parameters: <username> <hostname> <servername> <realname>
	server.registrationCommands.default('USER',
	function (client, username, hostname, servername, realname) {
		// Check if already registered
		if (client.registered) {
			client.deliver(server.name, 462,
					[client.name, 'You may not reregister']);
			return;
		}
		
		// Validate parameters
		if (username === undefined || hostname === undefined ||
				servername === undefined || realname === undefined) {
			throw 'ERR_NEEDMOREPARAMS';
		}
		
		// TODO: Critical validation
		// TODO: Hostname lookup
		
		// Custom validation
		if (!server.register.negotiate('may use user params', client,
				username, hostname, servername, realname)) {
			return;
		}
		
		// Apply
		client.username = username;
		client.hostname = hostname;
		client.servername = servername;
		client.realname = realname;
		
		// Can register
		server.register.canRegister(client);
	});
	
	//    Command: NICK
	// Parameters: <nick>
	server.commands.default('NICK', server.registrationCommands.default('NICK',
	function (client, nick) {
		// Check if nickname is given
		if (nick === undefined) {
			client.deliver(server.name, 431,
					[client.name, 'No nickname given']);
			return;
		}
		
		// Check if current nick is the same
		if (client.name === nick) {
			return;
		}
		
		// Validate nickname
		if (!server.register.negotiate('validate nickname', client, nick)) {
			return;
		}
		
		// Check if in use or only an alias
		if (!server.register.negotiate('check nickname in use', client, nick)) {
			return;
		}
		
		// Change nick
		if (!server.register.negotiate('may use nick', client, nick)) {
			return;
		}
		
		// Apply
		var oldNick = client.name;
		client.name = nick;
		
		// Can register
		server.register.canRegister(client, oldNick);
	}));
	
	//    Command: MOTD
	// Parameters: [<target>]
	server.commands.default('MOTD', function (client) {
		client.deliver(server.name, '375', [client.name, sprintf(
				'- %s Message of the Day -',
				server.name)]);
		server.motd.forEach(function (message) {
			client.deliver(server.name, '372',
					[client.name, '- ' + message]);
		});
		client.deliver(server.name, '376',
				[client.name, 'End of /MOTD command.']);
	});
};
