exports.extend = function(server) {
	//    Command: PING
	// Parameters: <server1> [<server2>]
	server.commands.default('PING', server.registrationCommands.default('PING',
	function(client, message) {
		if(message === undefined) {
			throw 'ERR_NEEDMOREPARAMS';
		}
		
		client.deliver(server.name, 'PONG', [server.name, message]);
	}));
	
	
}
