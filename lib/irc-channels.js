var EventManager = require('./eventmanager').EventManager;

exports.extend = function (server) {
	/*
	 * IRC channels
	 */

	server.channels = new EventManager({
		'join':
		function (client, channel) {
			var ch = server.channels.list[channel];
			if (!ch) {
				ch = server.channels.negotiate('create', channel, client);
			}
			var scand = client.name.toScandinavianLowerCase();
			if (ch.users[scand]) {
				return;
			}
			ch.users[scand] = client;
			client.channels[channel] = ch;
			server.channels.negotiate('deliver', channel, client, 'JOIN', [channel]);
		},

		'deliver':
		function (channel, client, cmd, args, except) {
			var target = server.channels.list[channel];
			if (!target) {
				client.deliver(server.name, 401,
						[client.name, channel, 'No such nick/channel']);
				return;
			}

			var recipients = target.users;
			for (var recipient in recipients) {
				var rcp = recipients[recipient];
				if (except && rcp === client) {
					continue;
				}
				var argscopy = [];
				for (var i = 0, l = args.length; i < l; ++i) {
					argscopy.push(args[i]);
				}
				rcp.deliver(client.name + '!' + client.hostname, cmd, argscopy);
			}
		},

		'create':
		function (channel, client) {
			var ch = server.channels.list[channel] = {users: {}, topic: '', mode: '', usermodes: {}};
			return ch;
		},

		'part':
		function (client, channel, message) {
			var ch = server.channels.list[channel];
			if (!ch) {
				client.deliver(server.name, 401,
				               [client.name, channel, 'No such nick/channel']);
				return;
			}
			var scand = client.name.toScandinavianLowerCase();
			if (!ch.users[scand]) {
				client.deliver(server.name, 442,
				               [client.name, channel, "You're not on that channel"]);
				return;
			}
			server.channels.negotiate('deliver', channel, client, 'PART', [channel, message]);
			delete ch.users[scand];
			delete client.channels[channel];
			var empty = true;
			for (var i in ch.users) {
				empty = false;
				break;
			}
			if (empty) {
				server.channels.negotiate('destroy', channel);
			}
		},

		'destroy': function (channel) {
			var ch = server.channels.list[channel];
			if (!ch) {
				throw 'No such channel '+channel;
			}
			var empty = true;
			for (var i in ch.users) {
				empty = false;
				break;
			}
			if (!empty) {
				throw "Can't destroy channel, not empty";
			}
			delete server.channels.list[channel];
		}
	});

	server.channels.list = {};

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
