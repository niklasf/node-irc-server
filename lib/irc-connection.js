var tools = require('./tools'),
	sprintf = require('sprintf').sprintf;

exports.extend = function (server) {
	/*
	 * Commands
	 */

	//    Command: PING
	// Parameters: <server1> [<server2>]
	server.commands.default('PING', server.registrationCommands.default('PING',
	function (client, message) {
		if (message === undefined) {
			throw 'ERR_NEEDMOREPARAMS';
		}
		
		client.deliver(server.name, 'PONG', [server.name, message]);
	}));
	
	//    Command: PONG
	// Parameters: <server1> [<server2]
	server.commands.default('PONG', server.registrationCommands.default('PONG',
	function (client, origin, message) {
		if (origin === undefined) {
			client.deliver(server.name, 409, ['No origin specified']);
			server.log.warn(client.remoteAddress, client.name,
					'No origin specified');
			return;
		}
		
		if (message === client.ping && client.ping !== undefined) {
			client.ping = undefined;
		} else {
			server.log.warn(client.remoteAddress, client.name,
					'PONG does not match a PING', client.ping, message);
		}
	}));
	
	//    Command: QUIT
	// Parameters: [<Quit message>]
	server.registrationCommands.default('QUIT', function (client, message) {
		// If the client did not yet register just log this and end the
		// connection.
		server.log.info(client.remoteAddress, client.name,
				'Client quit:', message);
		client.deliver(null, 'ERROR',
				[sprintf('Closing Link: %s (Client Quit)', client.hostname)]);
		client.end();
	});
	
	// TODO: Implement QUIT when registered
	// Example from freenode
	// (exactly once to those in a channel and the user itself):
	// :RevoOf!~niklas@p5484E1D8.dip.t-dialin.net QUIT :Quit: Leaving.
	
	/*
	 * Sends a ping to the client.
	 */
	 
	server.ping = function (client) {
		client.ping = tools.unixtime().toString();
	};
};
