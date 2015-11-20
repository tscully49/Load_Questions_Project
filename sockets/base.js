var Stopwatch = require('../models/stopwatch');
var stopwatch = Stopwatch();
var people = {};
var answers = {};
var allVotes = {};
var players = Array();
var question;
var personCount = 0;
var round = 1;
var state = 'Pregame'; // Options: Pregame, User Answers, bufferTime, User Voting, calculating, endgame
var hostButtons = "<div id='buttons-wrapper'><h3>Master Control</h3><button id='start-round' class='btn btn-success'>Click to start round</button>"+
                  "<button id='resume-timer' class='btn btn-success hidden'>Resume Timer</button>"+
                  "<button id='pause-timer' class='btn btn-warning hidden'>Pause Timer</button>"+
                  "<button id='reset-timer' class='btn btn-info hidden'>Reset Timer</button>"+
                  "</div><div id='end-round-wrapper'><button id='end-round' class='btn btn-danger hidden'>Reset Timer?</button></div>";
var hostBanner = "<h3 id='host-banner'>You are the host</h3>";

/*
h3#host-banner You are the host
#buttons-wrapper
  h3 Master Controls
  button#start-round.btn.btn-success Click to start round
  button#resume-timer.btn.btn-success.hidden Resume Timer
  button#pause-timer.btn.btn-warning.hidden Pause Timer
  button#reset-timer.btn.btn-info.hidden Reset Timer?
#end-round-wrapper
  button#end-round.btn.btn-danger.hidden End Round
*/
// Make a status variable that will not allow people to join the game AFTER answers are submitted or if people haven't answered a question


// Mongo Client information
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var collectionName = 'demo';
var mongo = function(db, callback) {
  MongoClient.connect('mongodb://loadedquestionsdb.cloudapp.net:27017/' + db, callback);
};

// Gets the start round function as a callback function then once the question text has been received it calls the start round with the response to populate the question
function queryData(startRound){
  mongo('demo', function(err, db) {
    // if there is an error log the error and display error message as question.
	  if (err){
	 	  console.log("Connection Error", err);
		  startRound("Database connection error.");
	  }

	  var collection = db.collection('questions');
    // Run the query then with the response from the database call the start round
	  var query = {};
	  collection.find(query).toArray(function(err, items) {
  		if (err) startRound("Query Error: ", err);
  		var index = Math.floor(Math.random() * 25);
  		var question = items[index];
  		db.close();
  		var questionText = question.questionText;
  		startRound(questionText);
  	});
  });
};


module.exports = function (io) {
	io.on('connection', function (socket) {
    socket.on('join', function (profile) {
    	if (Object.keys(people).length === 0) {
        personCount++;
        console.log("host-"+personCount+" joined");
    		people[socket.id] = {"name": profile.name, "image": profile.image, "email": profile.email, "host": true, "score": 0};
    	  socket.emit('isHost', hostButtons, hostBanner, profile.name);
      } else {
        personCount++;
        console.log("person-"+personCount+" joined");
    		people[socket.id] = {"name": profile.name, "image": profile.image, "email": profile.email, "host": false, "score": 0};
    	  socket.emit('isNotHost', profile.name);
      }
      socket.emit('updateRound', round);
      socket.emit('updateState', state);

      if (state === 'Pregame') {
        people[socket.id].isPlaying = true;
      } else {
        people[socket.id].isPlaying = false;
      }
    });

    // this will start the User Voting process
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
      endRound("Round was Cancelled, restarting soon...");
    });

    socket.on('disconnect', function() {
    	delete people[socket.id];
      delete answers[socket.id];
      // if people are User Voting, change the answers to remove that person's answer
    });

    // A user submits an answer to a question
    socket.on('submittedAnswer', function(answer) {
      answers[socket.id] = {'name_id': makeid(), 'name': people[socket.id].name, 'answer': answer};
    });

    socket.on('sendVotes', function(votes) {
      allVotes[socket.id] = votes;

      if (Object.keys(people).length === Object.keys(allVotes).length) {
        calculateVotes(allVotes);
      }  else {
        return;
      }
    });
	});

  // All other listeners are not within the CONNECTION listener

  stopwatch.on('tick', function(time) {
    console.log('stopwatch tick!' + time);
    io.emit('timer', { countdown: time });
  });

  stopwatch.on('endPhase', function() {
    if (state == "User Answers") {
      var names = {};
      var answersObject = {};

      state = 'User Voting';
      io.emit('updateState', state);
      io.emit('endQuestion');

      // Start User Voting on the answers
      for(var key in answers) {
        answersObject[answers[key].name_id] = answers[key].answer;
      }
      for(var key in people) {
        names[key] = people[key].name;
      }

      if (Object.keys(answers).length === 0) {
        endRound("No one answered the questions, resetting round...");        
        return;
      }

      shuffleArray(names);

      io.emit('startVoting', answersObject, names);
      stopwatch.reset(15000); // reset to two minutes
      stopwatch.start();
      return;
    }

    if (state == 'User Voting') {
      state = 'calculating';
      io.emit('updateState', state);
      io.emit('endVoting');
      // Show a loading... screen until the votes are tallied
      return;
    }
  });

  function startRound(questionText) {
    for (var val in people) {
      if (people[val].isPlaying === true) {
        players.push(val);
      }
    }
    
    state = "User Answers";
    io.emit('updateState', state);
    // Start User Answers the question
    question = questionText;
    io.emit('startQuestion', question);
    stopwatch.reset(10000); // reset stopwatch to one minute
    stopwatch.start();
  }

  function endRound(text) {
    // empty answers object
    for (var prop in answers) {
      if (answers.hasOwnProperty(prop)) {
        delete answers[prop];
      }
    }
    for (var prop in allVotes) {
      if (allVotes.hasOwnProperty(prop)) {
        delete allVotes[prop];
      }
    }
    // emit to all users a resetRound event (reset clock, hide questions, answers, and their answers)
    io.emit('resetRound', text);
    // Change state back to Pregame
    state = 'Pregame';
    io.emit('updateState', state);
    // emit a different event to the host??? Or check client side
    stopwatch.pause();
  }

  function calculateVotes(votes) {
    var scoreArray = []
    var numberCorrect = 0;
    // add up the votes and print out scores, and the rankings
    for (var person in votes) {
      numberCorrect = 0;
      for (var answer in votes[person]) {
        if (answers[votes[person][answer]] != null ) {
          if (answers[votes[person][answer]].name_id === answer) {
            //console.log("correct!!!");
            numberCorrect = numberCorrect + 1;
          } else {
            //console.log('wrong');
          }
        } else {
          //console.log('no answer');
        }
      }
      people[person].score = people[person].score + numberCorrect;
      scoreArray.push({"name": people[person].name, "score": people[person].score});
    }

    state = 'Pregame';
    for (var prop in answers) {
      if (answers.hasOwnProperty(prop)) {
        delete answers[prop];
      }
    }
    for (var prop in allVotes) {
      if (allVotes.hasOwnProperty(prop)) {
        delete allVotes[prop];
      }
    }

    scoreArray.sort(function(a, b){return b.score-a.score});
    round = round + 1;
    io.emit('updateRound', round);
    io.emit('roundOver', scoreArray); // will send an array back to the clients of the names and scores in sorted order
    io.emit('updateState', state);
  }
};

function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( var i=0; i < 5; i++ )
      text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

/**
 * Randomize array element order in-place.
 * Using Durstenfeld shuffle algorithm.
 */
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}
