var net = require('net'),
	sys = require('sys'),
	EventManager = require('./eventmanager').EventManager,
	tools = require('./tools'),
	Logger = require('logger').Logger;

/*
 * Creates an IRC server
 */

exports.createServer = function (options) {
	var server, log, connectionListener;
	
	//
	// Read messages,
	// buffer them,
	// parse them,
	// bring them to execution
	//

	connectionListener = function (client) {
		log.info(client.remoteAddress, 'Connection established.');
	
		// Buffer network IO and emit message events
		client.buffer = '';
		client.on('data', function (data) {
			var lines = data.toString().split(/\n|\r/),
				i, line;
			
			for (i = 0; i < lines.length - 1; i += 1) {
				line = client.buffer + lines[i];
				client.buffer = '';
				
				if (line.length <= 510) {
					client.emit('message', line);
				} else {
					log.warn(client.remoteAddress, client.name,
							'Bufferoverflow');
					client.buffer = '';
				}
			}
			
			client.buffer += lines[lines.length - 1];
			if (client.buffer.length >= 510) {
				log.warn(client.remoteAddress, client.name, 'Bufferoverflow.');
				client.buffer = '';
			}
		});
		
		// Parse messages
		client.on('message', function (line) {
			var parsed, command, remains, args;
		
			if (line.trim() === '') {
				return;
			}
			
			parsed = new RegExp(
					"^(:([a-zA-Z][a-zA-Z90-9-\\[\\]\\`^{}]*)(!\\S+)?" +
					"(@[a-zA-Z0-9-.]+)?\\ +)?" +
					"([a-zA-Z]+|[0-9]{3})(.*)$").exec(line);
			
			if (parsed) {
				command = parsed[5].toString().toUpperCase();
				remains = parsed[6].split(" :");
				args = remains[0].trim().split(/ +/);
				if (remains[1]) {
					args.push(remains[1].trim());
				}
				if (args.length) {
					if (args[0] === '') {
						args.shift();
					}
				}
				log.debug(client.remoteAddress, client.name, '>>>', line);
				client.emit('command', command, args);
			} else {
				log.warn(client.remoteAddress, client.name,
						'Illegal message syntax:', line);
			}
		});
		
		// Redirect commands
		client.on('command', function (command, args) {
			var commandSet = client.registered ?
					server.commands : server.registrationCommands,
				first, error;
			
			try {
				// Try to execute command
				first = [command.toUpperCase(), client];
				EventManager.prototype.negotiate.apply(
						commandSet, first.concat(args));
			} catch (err) {
				error = err;
				
				if (error === 'ERR_NEEDMOREPARAMS') {
					// Require more arguments
					client.deliver(server.name, 461,
							[client.name, 'Not enough parameters']);
				} else if (error === 'No implementation found') {
					if (server.commands.implemented(command)) {
						// Client didn't register
						error = 'ERR_NOTREGISTERED';
						client.deliver(server.name, client.name, 451,
								[client.name, 'You have not registered']);
					} else {
						// Command not found
						error = 'ERR_UNKNOWNCOMMAND';
						client.deliver(server.name, 421,
								[client.name, command, 'Unknown command']);
					}
				} else {
					throw error;
				}
				
				// Log this
				log.warn(client.remoteAddress, client.name,
					error, command, args);
			}
		});
		
		// Log all errors, do not die
		client.on('error', function () {
			log.warn(client.remoteAddress, client.name, 'Connection error',
					arguments);
		});
		
		// Deliver answers over the network by default
		if (client instanceof net.Stream) {
			client.deliver = function (from, command, args) {
				var out = '',
					lastArg;
				
				if (!Array.isArray(args)) {
					args = [args];
				}
				
				try {
					// Command, from and to
					if (from) {
						out += ':' + from + ' ';
					}
					out += command.toString().toUpperCase();
					
					// The arguements
					if (args.length) {
						lastArg = args.pop();
				
						if (args.length) {
							out += ' ' + args.join(' ');
						}
					
						out += ' :' + lastArg;
					}
					
					// Send end eventually log it
					log.debug(client.remoteAddress, client.name, '<<<', out);
					client.write(out + '\r\n');
					
				} catch (err) {
					log.warn(client.remoteAddress, client.name, err);
				}
			};
		}
		
		// Apply options
		tools.merge(client, {
			name: '*',
			channels: {}
		});
	};

	server = net.createServer(connectionListener);
	server.addClient = connectionListener;
	
	//
	// Options
	//
	
	// Overridable

	server.log = new Logger();
	server.loglevel = 'debug';

	server.name = 'node-irc';
	server.port = 6667;
	server.ip = '127.0.0.1';
	server.version = 'node-irc-server';
	server.creation = tools.timestamp();
	server.netname = server.name;
	server.usermodes = server.channelmodes = false; // FIXME

	server.motd = ['Welcome.'];
	
	tools.merge(server, options);
	server.modules = ['./irc-connection', './irc-register', './irc-user', './irc-channels'];
	if (options && options.modules) {
		server.modules = tools.merge(server.modules, options.modules);
	}
	
	// Non overridable
	
	log = server.log;
	log.setLevel(server.loglevel);
	
	//
	// Protocol implementation
	//
	
	server.registrationCommands = new EventManager();
	server.commands = new EventManager();
	
	server.modules.forEach(function (module) {
		require(module).extend(server);
	});
	
	//
	// Appply default port and host
	//
	
	server.listen = function () {
		if (arguments.length === 0) {
			net.Server.prototype.listen.call(server, server.port, server.ip);
		} else {
			net.Server.prototype.listen.apply(server, arguments);
		}
		log.info('*** SERVER LISTENING ***');
	};
	
	return server;
};
