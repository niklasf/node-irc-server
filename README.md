node-irc-server
===============
Implementation of the
[IRC server protocol](http://www.apps.ietf.org/rfc/rfc2812.html) using
[node.js](http://nodejs.org).

Demo
----
A demo is currently running on 'niklasf.no.de'.
Feel free to try and connect. Note that channels are not fully supported yet.

Warning
-------
You probably can't use this in production yet. Among the reasons are:

- Not the full command set is supported
- No server-server communication is supported
- This is not stable afterall

Usage
-----

    var irc = require('./lib/irc');
    
    var server = irc.createServer();
    server.listen();

Dependencies
------------
Required:

- Default node.js installation
- [node-logger](https://github.com/quirkey/node-logger)
- [sprintf](https://github.com/maritz/node-sprintf)

Optional:

- [nodeunit](https://github.com/caolan/nodeunit) to run testcases
- [nodelint](https://github.com/tav/nodelint) to run code quality checks

Contact
-------
[niklas.fiekas@googlemail.com](mailto://niklas.fiekas@googlemail.com)
