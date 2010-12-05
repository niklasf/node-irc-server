node-irc-server
===============
Implementation of the
[IRC server protocol](http://www.apps.ietf.org/rfc/rfc2812.html) using
[node.js](http://nodejs.org).

Warning
-------
You probably can't use this in production yet. Among the reasons are:

- Not the full command set is supported
- No server-server communication is supported
- This is not stable afterall

Usage:
------

    var irc = require('./lib/irc');
    
    var server = irc.createServer();
    server.listen();

Dependencies
------------
Required:

- Default node.js installation
- [node-logger](https://github.com/quirkey/node-logger)

Optional:

- [nodeunit](https://github.com/caolan/nodeunit) to run testcases

Contact
-------
[niklas.fiekas@googlemail.com](mailto://niklas.fiekas@googlemail.com)
