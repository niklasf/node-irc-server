EventManager
============

EventManager extends node's [EventEmitter](https://github.com/ry/node/blob/master/doc/api/events.markdown),
but adds some more power.

*default* and *negotiate*
-------------------------

You can add implementations for events using default. Unlike EventEmitter's
*on* or *addListener* your implementation can return a value. You can execute
your function by calling *negotiate*.

    var EventManager = require('./lib/eventmanager').EventManager,
        manager = new EventManager();
    
    manager.default('divide', function (first, secound) {
        return first / secound;
    });
    
    manager.on('add', function (first, secound) {
        console.log('Someone divided some numbers.');
        return 'Will be ignored';
    });
    
    assert.equals(manager.negotiate('divide', 8, 2), 4);

*implemented*
-------------

You can use *implemented* to check if an implementation is present.

    assert.ok(manager.implemented('divide'));

differences between *negotiate* and *emit*
------------------------------------------

Both methods do the same thing. They will trigger your implementation
and any other handler for the event. They will both return the result of
the implementation.

The only difference is, that *negotiate* will throw an exception if no
implementation is present (a handler added with *on* is no implementation),
while *emit* would silently return *undefined*.

overriding implementations
--------------------------

You can fully or partially override your implementations using *override*.
*override* will fail with an exception if no default implementation is present.

You can override as often as you want and create a stack of implementations.
The next level of the stack is *this.next*.
*this.next* is undefined in default implementations.

    manager.override('divide', function (first, secound) {
        if(secound === 0) {
            console.log('Divided by zero');
        } else {
            return this.next(first, secound);
        }
    });
