var net = require('net'),
	sys = require('sys'),
	EventManager = require('./eventmanager').EventManager,
	tools = require('tools');

exports.createServer = function(options) {
	var server;

	var connectionListener = function(client) {
		// Buffer network IO and emit message events
		client.buffer = '';
		client.on('data', function(data) {
			var lines = data.toString().split(/\n|\r/);
			
			for(var i = 0; i < lines.length - 1; i++) {
				var line = client.buffer + lines[i];
				client.buffer = '';
				
				if(line.length <= 510) {
					client.emit('message', line);
				} else {
					server.emit('buffer overflow', client)
					client.buffer = '';
				}
			}
			
			client.buffer += lines[lines.length - 1];
			if(client.buffer.length >= 510) {
				server.emit('warn', 'buffer overflow', client);
				client.buffer = '';
			}
		});
		
		// Parse messages
		client.on('message', function(line) {
			if(line.trim() === '') {
				return;
			}
			
			var parsed = new RegExp(
					"^(:([a-zA-Z][a-zA-Z90-9-\[\]\\`^{}]*)(!\S+)?" +
					"(@[a-zA-Z0-9-.]+)?\ +)?" +
					"([a-zA-Z]+|[0-9]{3})(.*)$").exec(line);
			
			if(parsed) {
				var command = parsed[5].toString().toUpperCase();
				var remains = parsed[6].split(" :");
				var args = remains[0].trim().split(/ +/);
				if(remains[1]) {
					args.push(remains[1].trim());
				}
				if(args.length) {
					if(args[0] === '') {
						args.shift();
					}
				}
				server.emit('debug', 'message recieved', client, line);
				client.emit('command', command, args);
			} else {
				server.emit('warn', 'illegal message syntax', client, line);
			}
		});
		
		// Redirect commands
		client.on('command', function(command, args) {
			if(client.registered) {
				try {
					server.commands.negotiate(command, args);
				} catch(err) {
					client.deliver(server.name, client.name, 421,
							[command, 'Unknown command']);
					server.emit('warn', 'unkown command', client, command, args);
				}
			} else {
				try {
					server.registrationCommands.negotiate(command, args);
				} catch(err) {
					if(server.commands.implemented(command)) {
						client.deliver(server.name, client.name, 451,
								['You have not registered']);
						server.emit('warn', 'client was not registered',
								client, command, args);
					} else {
						client.deliver(server.name, client.name, 421,
								[command, 'Unknown command']);
						server.emit('warn', 'unkown command',
								client, command, args);
					}
				}
			}
		});
	};

	server = net.createServer(connectionListener);
	server.addClient = connectionListener;
	
	server.logger = require('logger').createLogger();
	
	tools.merge(server, options);
	
	server.on('debug', server.logger.debug);
	server.on('info', server.logger.info);
	server.on('warn', server.logger.warn);
	server.on('error', server.logger.error);
	server.on('fatal', server.logger.fatal);
	
	return server;
};
