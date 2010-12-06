var net = require('net'),
	sys = require('sys'),
	EventManager = require('./eventmanager').EventManager,
	tools = require('./tools'),
	Logger = require('logger').Logger;

/*
 * Delivers the given message to the specified clients
 */

exports.deliver = function(from, to, command, args) {
	if(!Array.isArray(args)) {
		args = [args];
	}
	
	// TODO: Implement
};

/*
 * Creates an IRC server
 */

exports.createServer = function(options) {
	var server;
	
	var log;

	//
	// Read messages,
	// buffer them,
	// parse them,
	// bring them to execution
	//

	var connectionListener = function(client) {
		log.info(client.remoteAddress, 'Connection established.');
	
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
					log.warn(client.remoteAddress, client.name,
							'Bufferoverflow');
					client.buffer = '';
				}
			}
			
			client.buffer += lines[lines.length - 1];
			if(client.buffer.length >= 510) {
				log.warn(client.remoteAddress, client.name, 'Bufferoverflow.');
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
				log.debug(client.remoteAddress, client.name, '>>>', line);
				client.emit('command', command, args);
			} else {
				log.warn(client.remoteAddress, client.name,
						'Illegal message syntax:', line);
			}
		});
		
		// Redirect commands
		client.on('command', function(command, args) {
			var commandSet = client.registered ?
					server.commands : server.registrationCommands;
			try {
				// Try to execute command
				var first = [command.toUpperCase(), client];
				EventManager.prototype.negotiate.apply(
						commandSet, first.concat(args));
			} catch(err) {
				if(server.commands.implemented(command)) {
					// Client didn't register
					err = 'ERR_NOTREGISTERED';
					client.deliver(server.name, client.name,
							451, 'You have not registered');
				} else if(err === 'No implementation found') {
					// Command not found
					err = 'ERR_UNKOWNCOMMAND';
					client.deliver(server.name, client.name,
							421, command, 'Unkown command');
				} else if(err === 'ERR_NEEDMOREPARAMS') {
					// Require more arguments
					client.deliver(server.name, client.name,
							461, 'Not enough parameters');
				} else {
					throw err;
				}
				
				// Log this
				log.warn(client.remoteAddress, client.name,
					err, command, args);
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
					log.debug(client.remoteAddress, client.name, '<<<', out);
					client.write(out + '\r\n');
					
				} catch(err) {
					log.warn(client.remoteAddress, client.name, err);
				}
			}
		}
		
		// Apply options
		tools.merge(client, {
			name: '*'
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
	
	tools.merge(server, options);
	
	// Non overridable
	log = server.log;
	log.setLevel(server.loglevel);
	
	// TODO: Add client list
	// TODO: Add channel list
	
	//
	// Register implementations
	//
	
	server.registrationCommands = new EventManager();
	server.commands = new EventManager();
	
	require('./irc-connection.js').extend(server);
	
	//
	// Appply default port
	//
	
	server.listen = function() {
		if(arguments.length === 0) {
			net.Server.prototype.listen.call(server, server.port);
		} else {
			net.Server.prototype.listen.apply(server, arguments);
		}
		log.info('*** SERVER LISTENING ***');
	};
	
	return server;
};
