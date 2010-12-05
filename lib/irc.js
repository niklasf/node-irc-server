var net = require('net'),
	sys = require('sys'),
	EventManager = require('./eventmanager').EventManager,
	tools = require('./tools'),
	Logger = require('logger').Logger;

exports.createServer = function(options) {
	var server;

	//
	// Read messages,
	// buffer them,
	// parse them,
	// bring them to execution
	//

	var connectionListener = function(client) {
		server.emit('info', 'client connected',
				client.name, client.remoteAddress);
	
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
					server.emit('buffer overflow', client.name,
							client.remoteAddress);
					client.buffer = '';
				}
			}
			
			client.buffer += lines[lines.length - 1];
			if(client.buffer.length >= 510) {
				server.emit('warn', 'buffer overflow', client.name,
						client.remoteAddress);
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
				server.emit('debug', 'message recieved',
						client.name, client.remoteAddress, line);
				client.emit('command', command, args);
			} else {
				server.emit('warn', 'illegal message syntax',
						client.name, client.remoteAddress, line);
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
					server.emit('warn', 'unkown command', client.name,
							client.remoteAddress, command, args);
				}
			} else {
				try {
					server.registrationCommands.negotiate(command, args);
				} catch(err) {
					if(server.commands.implemented(command)) {
						client.deliver(server.name, client.name, 451,
								['You have not registered']);
						server.emit('warn', 'client was not registered',
								client.name, client.remoteAddress,
								command, args);
					} else {
						client.deliver(server.name, client.name, 421,
								[command, 'Unknown command']);
						server.emit('warn', 'unkown command',
								client.name, client.remoteAddress,
								command, args);
					}
				}
			}
		});
		
		// Deliver answers over the network by default
		if(client instanceof net.Stream) {
			client.deliver = function(from, to, command, args) {
				if(!Array.isArray(args)) {
					args = [args];
				}
			
				var out;
				
				try {
					// Command, from and to
					out = ':' + from + ' ' +
							command.toString().toUpperCase();
					if(to) {
						out += ' ' + to;
					}
					
					// The arguements
					if(args.length) {
						var lastArg = args.pop();
				
						if(args.length) {
							out += ' ' + args.join(' ');
						}
					
						out += ' :' + lastArg;
					}
					
					// Send end eventually log it
					server.emit('debug', 'message sent', client.name,
							client.remoteAddress, out);
					client.write(out + '\r\n');
					
				} catch(err) {
					server.emit('warn', 'problem while delivering',
							client.name, client.remoteAddress, out, err);
				}
			}
		}
		
		tools.merge(client, {
			name: '*'
		});
	};

	server = net.createServer(connectionListener);
	
	//
	// Options
	//
	
	server.logger = new Logger();
	server.name = 'node-irc';
	server.port = 6667;
	
	tools.merge(server, options);
	
	//
	// Register implementations
	//
	
	var levels = ['debug', 'info', 'warn', 'error', 'fatal'];
	levels.forEach(function(level) {
		server.on(level, function() {
			Logger.prototype[level].apply(server.logger, arguments);
		});
	});
	
	server.registrationCommands = new EventManager();
	server.commands = new EventManager();
	
	server.listen = function() {
		if(arguments.length === 0) {
			net.Server.prototype.listen.call(server, server.port);
		} else {
			net.Server.prototype.listen.apply(server, arguments);
		}
		server.emit('info', 'server is listening');
	};
	
	return server;
};
