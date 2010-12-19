var EventManager = require('./eventmanager').EventManager;

exports.extend = function (server) {
	/*
	 * Interfaces
	 */
	
	// An extensible manager that does messaging
	
	server.messaging = new EventManager({
		'deliver':
		function (client, to, message) {
			// delegate to server.channels
			if (server.channels && to.charAt(0) === '#') {
				return server.channels.negotiate('deliver', to, client, 'PRIVMSG', [to, message], true);
			}

			// Find target (a single client)
			var target = server.register.clients[to.toScandinavianLowerCase()];
			if (!target) {
				client.deliver(server.name, 401,
						[client.name, to, 'No such nick/channel']);
				return;
			}
			
			// Deliver private message
			target.deliver(client.name + '!' + client.hostname, 'PRIVMSG',
					[target.name, message]);
			
			// Maybe an away message has to be delivered
			if (target.away !== undefined) {
				client.deliver(server.name, 301,
						[client.name, target.name, target.away]);
			}
		}
	});
	
	/*
	 * Commands
	 */
	
	//    Command: PRIVMSG
	// Parameters: <target>{,<target>} <text to send>
	server.commands.default('PRIVMSG', function (client, to, message) {
		var recipients = [];
		
		// Split recipient list
		if (to !== undefined) {
			recipients = to.split(',');
		}
		if (recipients.length === 0) {
			client.deliver(server.name, 411,
					[client.name, 'No recipient given (PRIVMSG)']);
			return;
		}
		
		// Verify if there is a message
		if (message === undefined || message === '') {
			client.deliver(server.name, 412, [client.name, 'No text to send']);
			return;
		}
		
		// Try to send it
		recipients.forEach(function (recipient) {
			server.messaging.negotiate('deliver', client, recipient, message);
		});
	});
	
	//    Command: AWAY
	// Parameters: [<text>]
	server.commands.default('AWAY', function (client, text) {
		if (text === undefined || text === '') {
			// Client is no longer away
			client.away = undefined;
			client.deliver(server.name, 305,
					[client.name, 'You are no longer marked as being away']);
		} else {
			client.away = text;
			client.deliver(server.name, 306,
					[client.name, 'You have been marked a being away']);
		}
	});
};
