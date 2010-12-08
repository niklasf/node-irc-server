var tools = require('./tools'),
	assert = require('assert'),
	sprintf = require('sprintf').sprintf;

exports.extend = function(server) {
	/*
	 * Registration commands
	 */
	
	//    Command: PASS
	// Parameters: <passphrase>
	server.registrationCommands.default('PASS', function(client, pass) {
		// Check if already registered
		if(client.registered) {
			client.deliver(server.name, 462,
					[client.name, 'You may not reregister']);
			return;
		}
		
		// Validate parameter and apply
		if(pass === undefined) {
			throw 'ERR_NEEDMOREPARAMS';
		}
		client.password = pass;
	});
	
	//    Command: USER
	// Parameters: <username> <hostname> <servername> <realname>
	server.registrationCommands.default('USER',
	function(client, username, hostname, servername, realname) {
		// Check if already registered
		if(client.registered) {
			client.deliver(server.name, 462,
					[client.name, 'You may not reregister']);
			return;
		}
		
		// Validate parameters
		if(username === undefined || hostname === undefined ||
				servername === undefined || realname === undefined) {
			throw 'ERR_NEEDMOREPARAMS';
		}
		
		// Apply
		client.username = username;
		client.hostname = hostname;
		client.servername = servername;
		client.realname = realname;
		
		// Can register
		if(client.name !== '*') {
			server.performInitialRegistration(client, client.name);
		}
	});
	
	//    Command: NICK
	// Parameters: <nick>
	server.commands.default('NICK', server.registrationCommands.default('NICK',
	function(client, nick) {
		// Check if nickname is given
		if(nick === undefined) {
			client.deliver(server.name, 431,
					[client.name, 'No nickname given']);
			return;
		}
		
		// Validate nickname
		if(!(/[A-Za-z][A-Za-z0-9-\[\]\\`^\{\}]{1,19}/.exec(nick))) {
			client.deliver(server.name, 432,
					[client.name, nick, 'Erroneous Nickname']);
			return;
		}
		
		// Check if in use or only an alias
		var use = server.findClient(nick);
		if(use && use.name.toScandinavianLowerCase() ===
				nick.toScandinavianLowerCase()) {
			client.deliver(server.name, 433,
					[client.name, nick, 'Nickname is allready in use.']);
			return;
		}
		
		// Apply
		if(client.username !== undefined && client.hostname !== undefined &&
				client.servername !== undefined &&
				client.realname !== undefined) {
			var oldName = client.name;
			client.name = nick;
			
			if(client.registered) {
				if(!server.registerClient(client)) {
					client.name = client.oldName;
					client.deliver(server.name, 'ERROR',
							['Change of nickname denied']);
				} else {
					// TODO: Inform intrested people
				}
			} else {
				server.performInitialRegistration(client, oldName);
			}
		}
	}));
	
	/*
	 * Does the initial registration of a client, delivering welcome stuff
	 * if successful.
	 */
	if(!server.performInitialRegistration) {
		server.performInitialRegistration = function(client, oldName) {
			if(server.registerClient(client)) {
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
				
				// Send message of the day
				// TODO: Move to own command
				client.deliver(server.name, '375', [client.name, sprintf(
						'- %s Message of the Day -',
						server.name)]);
				server.motd.forEach(function(message) {
					client.deliver(server.name, '372',
							[client.name, '- ' + message]);
				});
				client.deliver(server.name, '376',
						[client.name, 'End of /MOTD command.']);
				
				// Done
				assert.ok(client.registered);
			} else {
				client.deliver(server.name, 'ERROR',
						['Registration denied']);
			}
		};
	}
};
