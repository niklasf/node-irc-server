var logger = require('logger').createLogger();

exports["log on all levels"] = function(test) {
	test.expect(1);

	test.doesNotThrow(function() {
		logger.debug('Test', [1, 2, 3]);
		logger.info('Test', [1, 2, 3]);
		logger.warn('Test', [1, 2, 3]);
		logger.error('Test', [1, 2, 3]);
		logger.fatal('Test', [1, 2, 3]);
	});
	
	test.done();
};
