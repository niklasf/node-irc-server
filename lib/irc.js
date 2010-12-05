var net = require('net'),
	sys = require('sys'),
	EventManager = require('./eventmanager').EventManager;

function Server() {
	if(!(this instanceof Server)) {
		return new Server();
	}
	
	EventManager.call(this);
	
	var self = this;
	
	this.network = net.createServer(function(client) {
		self.emit('connection', client);
	});
	
	this.network.on('close', function() {
		self.emit('close')
	});
}

sys.inherits(Server, EventManager);

Server.prototype.listen = function() {
	if(arguments.length === 0) {
		return this.network.listen(6667);
	} else {
		return net.Server.prototype.listen.apply(this.network, arguments);
	}
};

Server.prototype.close = function() {
	return net.Server.prototype.close.apply(this.network, arguments);
};

exports.createServer = function() {
	return new Server();
};
