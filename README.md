node-irc-server
===============
Implementation of the
[IRC server protocol](http://www.apps.ietf.org/rfc/rfc2812.html) using
[node.js](http://nodejs.org).

Obsolete
--------
This project is obsolute. [alexyoung/ircd.js](https://github.com/alexyoung/ircd.js) implements a larger command set of the RFCs and does that in a nicer way. 

Demo
----
A demo is currently running on 'niklasf.no.de'.
Feel free to try and connect. Note that channels are not fully supported yet.

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
