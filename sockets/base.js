var Stopwatch = require('../models/stopwatch');
var stopwatch = Stopwatch();
var people = {};
var answers = {};
var question;
var personCount = 0;
var state = 'pregame'; // Options: pregame, answering, bufferTime, voting, calculating, endgame
// Make a status variable that will not allow people to join the game AFTER answers are submitted or if people haven't answered a question

var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var collectionName = 'demo';
var mongo = function(db, callback) {
        MongoClient.connect('mongodb://loadedquestionsdb.cloudapp.net:27017/' + db, callback);
};

function queryData(startRound){
  mongo('demo', function(err, db) {
  				if (err){
  					 console.log("Connection Error", err);
  					 return "Database connection error.";
  				 }

  				var collection = db.collection('questions');

  				var query = {};
  				collection.find(query).toArray(function(err, items) {
  								if (err) respond(res, {"Query Error": err});
  								var index = Math.floor(Math.random() * 25);
  								var question = items[index];
  								db.close();
									var questionText = question.questionText;
									console.log(JSON.stringify(questionText));
  								startRound(questionText);
  				});
  });
};


module.exports = function (io) {
	io.on('connection', function (socket) {
	    //socket.on('join', function () {
	    	if (Object.keys(people).length === 0) {
          personCount++;
          console.log("host-"+personCount+" joined");
	    		people[socket.id] = {"name": "host-"+personCount, "image": "fake picture", "host": true};
	    	  socket.emit('isHost');
        } else {
          personCount++;
          console.log("person-"+personCount+" joined");
	    		people[socket.id] = {"name": "person-"+personCount, "image": "other picture", "host": false};
	    	}
        socket.emit('connected');
	    //});

      // this will start the voting process
	    socket.on('startRound', function() {
				queryData(startRound);
			});

	    socket.on('pauseTimer', function() {
	    	stopwatch.pause();
	    });

	    socket.on('resetTimer', function(seconds) {
	    	stopwatch.reset(seconds);
	    });

      socket.on('resumeTimer', function() {
        stopwatch.resume();
      });

      socket.on('cancelRound', function() {
        // empty answers object
        for (var prop in answers) {
          if (answers.hasOwnProperty(prop)) {
            delete answers[prop];
          }
        }
        // emit to all users a resetRound event (reset clock, hide questions, answers, and their answers)
        io.emit('resetRound');
        // Change state back to pregame
        state = 'pregame';
        // emit a different event to the host??? Or check client side
        stopwatch.pause();
      });

	    socket.on('disconnect', function() {
	    	delete people[socket.id];
        delete answers[socket.id];
        // if people are voting, change the answers to remove that person's answer
	    });

      // A user submits an answer to a question
      socket.on('submittedAnswer', function(answer) {
        answers[socket.id] = {'name_id': makeid(), 'name': people[socket.id].name, 'answer': answer};
      });
	});

  // All other listeners are not within the CONNECTION listener

  stopwatch.on('tick', function(time) {
    console.log('stopwatch tick!' + time);
    io.emit('timer', { countdown: time });
  });

  stopwatch.on('endPhase', function() {
    if (state == "answering") {
      var names = {};
      var answersObject = {};

      state = "voting";
      io.emit('endQuestion');

      // Start voting on the answers
      for(var key in answers) {
        names[key] = answers[key].name;
        answersObject[answers[key].name_id] = answers[key].answer;
      }
      console.log(answersObject); 

      io.emit('startVoting', answersObject, names);
      stopwatch.reset(5000); // reset to two minutes
      stopwatch.start();
      return;
    }

    if (state == "voting") {
      state = "calculating";
      io.emit('endVoting');
      // Show a loading... screen until the votes are tallied
      // Tally up votes
      return;
    }
  });

  function startRound(questionText) {
    state = "answering";

    // Start answering the question
    question = questionText;
		console.log(question);
    io.emit('startQuestion', question);
    stopwatch.reset(10000); // reset stopwatch to one minute
    stopwatch.start();
  }
};

function calculateVotes() {
  // add up the votes and print out scores, and the rankings
}

function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( var i=0; i < 5; i++ )
      text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}
