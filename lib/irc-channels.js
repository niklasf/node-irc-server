var EventManager = require('./eventmanager').EventManager;

exports.extend = function (server) {
	/*
	 * IRC channels
	 */

	server.channels = new EventManager({
		'join':
		function (client, channel) {
			var ch = server.channels.list[channel],
				scand;
			if (!ch) {
				ch = server.channels.negotiate('create', channel, client);
			}
			scand = client.name.toScandinavianLowerCase();
			if (ch.users[scand]) {
				return;
			}
			ch.users[scand] = client;
			client.channels[channel] = ch;
			server.channels.negotiate('deliver', channel, client, 'JOIN',
					[channel]);
		},

		'deliver':
		function (channel, client, cmd, args, except) {
			var target = server.channels.list[channel],
				recipients, recipient, rcp, argscopy, i, l;
			if (!target) {
				client.deliver(server.name, 401,
						[client.name, channel, 'No such nick/channel']);
				return;
			}

			recipients = target.users;
			for (recipient in recipients) {
				if (recipients.hasOwnProperty(recipient)) {
					rcp = recipients[recipient];
					if (except && rcp === client) {
						continue;
					}
					argscopy = [];
					for (i = 0, l = args.length; i < l; i += 1) {
						argscopy.push(args[i]);
					}
					rcp.deliver(client.name + '!' + client.hostname,
							cmd, argscopy);
				}
			}
		},

		'create':
		function (channel, client) {
			var ch = server.channels.list[channel] = {users: {}, topic: '',
					mode: '', usermodes: {}};
			return ch;
		},

		'part':
		function (client, channel, message) {
			var ch = server.channels.list[channel],
				i, scand, empty;
			if (!ch) {
				client.deliver(server.name, 401,
				               [client.name, channel, 'No such nick/channel']);
				return;
			}
			scand = client.name.toScandinavianLowerCase();
			if (!ch.users[scand]) {
				client.deliver(server.name, 442,
						[client.name, channel, "You're not on that channel"]);
				return;
			}
			server.channels.negotiate('deliver', channel, client, 'PART',
					[channel, message]);
			delete ch.users[scand];
			delete client.channels[channel];
			empty = true;
			for (i in ch.users) {
				if (ch.users.hasOwnProperty(i)) {
					empty = false;
					break;
				}
			}
			if (empty) {
				server.channels.negotiate('destroy', channel);
			}
		},

		'destroy': function (channel) {
			var ch = server.channels.list[channel],
				empty = true,
				i;
			if (!ch) {
				throw 'No such channel ' + channel;
			}
			for (i in ch.users) {
				if (ch.users.hasOwnProperty(i)) {
					empty = false;
					break;
				}
			}
			if (!empty) {
				throw "Can't destroy channel, not empty";
			}
			delete server.channels.list[channel];
		}
	});

	server.channels.list = {};
	
	/*
	 * Extended things
	 */
	
	// Channels can be in recipient lists

	server.messaging.override('deliver', function (client, to, message) {
		// delegate to server.channels
		if (server.channels && (to.charAt(0) === '#' || to.charAt(0) === '&')) {
			return server.channels.negotiate('deliver', to, client, 'PRIVMSG',
					[to, message], true);
		} else {
			return this.next(client, to, message);
		}
	});

	/*
	 * Commands
	 */

	//    Command: JOIN
	// Parameters: <target>
	server.commands.default('JOIN', function (client, target) {
		server.channels.negotiate('join', client, target);
	});
	
	//    Command: PART
	// Parameters: <target> <message>
	server.commands.default('PART', function (client, target, message) {
		server.channels.negotiate('part', client, target, message);
	});
};
