var Stopwatch = require('../models/stopwatch');
var people = {};
var stopwatch = Stopwatch();

module.exports = function (io) {

	io.on('connection', function (socket) {
	    //console.log("Someone joined...");

	    //socket.on('join', function () {
	    	if (Object.keys(people).length === 0) {
	    		console.log('host joined');
	    		people[socket.id] = {"name": "host", "image": "fake picture", "host": true};
	    	} else {
	    		console.log("Someone else joined");
	    		people[socket.id] = {"name": "person", "image": "other picture", "host": false};
	    	}
	    	console.log(people);
	    //});

	    socket.on('startTimer', function() {
	    	stopwatch.start();
	    });

	    socket.on('stopTimer', function() {
	    	stopwatch.stop();
	    });

	    socket.on('resetTimer', function() {
	    	stopwatch.reset();
	    });

	    socket.on('disconnect', function() {
	    	delete people[socket.id];
	    	console.log("someone left");
	    	console.log(people);
	    });

	    // Stopwatch logic 
	    stopwatch.on('tick', function(time) {
	    	console.log(socket.id + '---stopwatch tick!' + time);
	    	socket.emit('timer', { countdown: time });
	    });
	});
};