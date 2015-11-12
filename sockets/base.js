var Stopwatch = require('../models/stopwatch');
var stopwatch = Stopwatch();
var people = {};
var answers = {};
var question;
// Make a status variable that will not allow people to join the game AFTER answers are submitted or if people haven't answered a question

module.exports = function (io) {

	io.on('connection', function (socket) {
	    question = "What is your favorite animal?";
	    socket.emit('currentQuestion', question);

	    //socket.on('join', function () {
	    	if (Object.keys(people).length === 0) {
	    		console.log('host joined');
	    		people[socket.id] = {"name": "host", "image": "fake picture", "host": true};
	    	  socket.emit('isHost');
        } else {
	    		console.log("Someone else joined");
	    		people[socket.id] = {"name": "person", "image": "other picture", "host": false};
	    	}
	    	//console.log(people);
	    //});

      // this will start the voting process
	    socket.on('startTimer', function() {
	    	var names = [];
        var answersList = [];
        
        for(var key in answers) {
          answersList.push(answers[key].answer);
        }

        // Gather a list of everyone's names
        for(var key in people) {
          names.push(people[key].name);
        }

        io.emit('startVoting', answersList, names);
        stopwatch.start();
        console.log(answers);
	    });

	    socket.on('stopTimer', function() {
	    	stopwatch.stop();
	    });

	    socket.on('resetTimer', function() {
	    	stopwatch.reset();
	    });

	    socket.on('disconnect', function() {
	    	delete people[socket.id];
        delete answers[socket.id];
        // if people are voting, change the answers to remove that person's answer
	    	//console.log("someone left");
	    	//console.log(people);
	    });

      // A user submits an answer to a question
      socket.on('submittedAnswer', function(answer) {
        answers[socket.id] = {'user': socket.id, 'name': people[socket.id].name, 'answer': answer};
      });

	    // Stopwatch logic 
	    stopwatch.on('tick', function(time) {
	    	console.log(socket.id + '---stopwatch tick!' + time);
	    	socket.emit('timer', { countdown: time });
	    });
	});
};

function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}