var tools = require('./tools');

exports.extend = function(server) {
	/*
	 * Commands
	 */

	//    Command: PING
	// Parameters: <server1> [<server2>]
	server.commands.default('PING', server.registrationCommands.default('PING',
	function(client, message) {
		if(message === undefined) {
			throw 'ERR_NEEDMOREPARAMS';
		}
		
		client.deliver(server.name, 'PONG', [server.name, message]);
	}));
	
	//    Command: PONG
	// Parameters: <server1> [<server2]
	server.commands.default('PONG', server.registrationCommands.default('PONG',
	function(client, origin, message) {
		if(origin === undefined) {
			client.deliver(server.name, 409, ['No origin specified']);
			return;
		}
		
		if(message === client.ping) {
			client.ping === message;
		}
	}));
	
	/*
	 * Sends a ping to the client.
	 */
	 
	server.ping = function(client) {
		client.ping = tools.unixtime();
	};
}
