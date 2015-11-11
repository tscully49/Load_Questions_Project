var Stopwatch = require('../models/stopwatch');

module.exports = function (io) {
	var stopwatch = Stopwatch();

	io.on('connection', function (socket) {
	    console.log("Someone joined...");

	    stopwatch.on('tick', function(time) {
	    	console.log('stopwatch tick!' + time);
	    	io.emit('timer', { countdown: time });
	    });

	    socket.on('startTimer', function() {
	    	stopwatch.start();
	    });

	    socket.on('stopTimer', function() {
	    	stopwatch.stop();
	    });

	    socket.on('resetTimer', function() {
	    	stopwatch.reset();
	    });
	});
};