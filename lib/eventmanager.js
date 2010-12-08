var EventEmitter = require('events').EventEmitter,
	assert = require('assert'),
	sys = require('sys');

/*
 * Provide the EventManager class
 */

function EventManager(defaults) {
	if (!(this instanceof EventManager)) {
		return new EventManager(defaults);
	}
	
	EventEmitter.call(this);
	
	this.route = { };
	
	if (defaults) {
		for (var key in defaults) {
			if (defaults.hasOwnProperty(key)) {
				this.route[key] = [defaults[key]];
			}
		}
	}
}

sys.inherits(EventManager, EventEmitter);

exports.EventManager = EventManager;

/*
 * EventManager.default:
 * Add a default implementation for an event
 */

EventManager.prototype.default = function (event, cb) {
	if (this.route[event]) {
		throw 'Default implementation for ' + event + ' is already there.';
	}
	
	this.route[event] = [cb];
	
	return cb;
};

/*
 * EventManager.override:
 * Override any implementation of an event
 */

EventManager.prototype.override = function (event, cb) {
	if (!this.route[event]) {
		throw 'Cant override an event that does not exist: ' + event;
	}
	
	this.route[event].push(cb);
	
	return cb;
};

/*
 * EventManager.implemented:
 * Checks, if an implementation for the event exists
 */

EventManager.prototype.implemented = function (event) {
	return this.route[event] ? true : false;
};

/*
 * EventManager.emit:
 * Send an event
 */

EventManager.prototype.emit = function () {
	var event = arguments[0],
		args = Array.prototype.slice.call(arguments, 1, arguments.length),
		route = this.route[event],
		i, result;
	
	assert.ok(arguments.length >= 1);
	
	EventEmitter.prototype.emit.apply(this, arguments);
	
	if (route) {
		assert.notEqual(route.length, 0);
		
		for (i = route.length - 1; i > 0; i -= 1) {
			route[i].next = route[i - 1];
		}
		result = route[route.length - 1].apply(route[route.length - 1], args);
		
		for (i = 0; i < route.length; i += 1) {
			route[i].next = undefined;
		}
		
		return result;
	}
};

/*
 * EventManager.negotiate:
 * Send an event and require an implementation
 */

EventManager.prototype.negotiate = function (event) {
	var result = EventManager.prototype.emit.apply(this, arguments);
	
	if (!EventManager.prototype.implemented.call(this, event)) {
		throw "No implementation found";
	}
	
	return result;
};
