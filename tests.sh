#!/usr/local/bin/node

require.paths.push(__dirname);
require.paths.push(__dirname + '/lib');
require.paths.push(__dirname + '/tests');

var runner = require('nodeunit').reporters.default;
process.chdir(__dirname);
runner.run(['tests']);
