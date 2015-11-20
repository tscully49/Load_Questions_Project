var socket;
var isHost = false;

$(document).ready(function() {
	socket = io(); // window.location.hostname
  $('#timer-buttons').hide();
  $('#host-banner').hide();
  // DO THIS ON A CONNECTION $('#server-disconnect').remove();

  ///////////////////////////////////////////////////////////////////
  //////////////////////// Socket listeners ////////////////////////////////
  ///////////////////////////////////////////////////////////////////

	socket.on('timer', function (data) {
		$('#timer').html(data.countdown);
	});

  socket.on('isHost', function() {
    $('#timer-buttons').show();
    $('#host-banner').show();
    isHost = true;
  })

	socket.on('startQuestion', function(question) {
    $('#alert-end-round').remove();
    $('#current-score').addClass('hidden');
    $('#score').empty();
    $('#answer-to-question-wrapper').removeClass('hidden');
    $('#question-box-wrapper').removeClass('hidden');
		$('#question-box').html(question);
	});

  socket.on('endQuestion', function() {
    $('#answer-to-question-wrapper').addClass('hidden');
    $('#question-box-wrapper').addClass('hidden');
    $('#question-box').empty();
  });

  socket.on('startVoting', function(answers, names) {
    $('#all-answers-for-voting').removeClass('hidden');
    $('#all-answers-for-voting').append(generatePoll(answers, names));
  });

  socket.on('endVoting', function() {
    var returnArray = {};
    // loading screen
    $('.select-people').each(function() {
      returnArray[$(this).attr('id')] = $(this).val();
    });
    $('#answers-header').nextAll().remove();
    $('#all-answers-for-voting').addClass('hidden')
    // Display results after????
    socket.emit('sendVotes', returnArray);
  });

  socket.on('resetRound', function(text) {
    var endRoundAlert = $("<div id='alert-end-round' class='alert alert-danger alert-dismissible fade in' role='alert'>"+
                        "<button type='button' class='close' data-dismiss='alert' aria-label="+
                        "'Close'><span aria-hidden='true'>&times;</span>"+
                        "</button>"+text+"</div>").hide().fadeIn();
    refreshRound();
    //Create a warning box saying that the round was cancelled ssff
    $('#alert-end-round').remove();
    $('#game-wrapper').append(endRoundAlert);
  });

  socket.on('roundOver', function(scores) {
    $('#current-score').removeClass('hidden');
    $('#score').empty().append(showScores(scores));
    refreshRound();
  });

  socket.on('disconnect', function() {
    var disconnectAlert = $("<div id='alert-end-round' class='alert alert-danger alert-dismissible fade in' role='alert'>"+
                        "<button type='button' class='close' data-dismiss='alert' aria-label="+
                        "'Close'><span aria-hidden='true'>&times;</span>"+
                        "</button>Server Disconnected, working on a fix...</div>").hide().fadeIn();
    refreshRound();
    console.log('server-disconnected');
    $('#server-disconnect').empty().append(disconnectAlert);
  });

  /////////////////////////////////////////////////////////////////
  ////////////////// end of socket listeners ////////////////////////////////////
  /////////////////////////////////////////////////////////////////


  /////////////////////////////////////////////////////////////////
  //// START Button event listeners that will emit to sockets ///////////////////
  /////////////////////////////////////////////////////////////////

	$('#start-round').click(function() {
		socket.emit('startRound');
    $(event.target).addClass('hidden');
    $('#resume-timer').removeClass('hidden').prop('disabled', true);
    $('#end-round').removeClass('hidden');
    $('#pause-timer').removeClass('hidden');
    $('#reset-timer').removeClass('hidden');
	});

	$('#pause-timer').click(function() {
    $(event.target).prop('disabled', true);
    $('#resume-timer').prop('disabled', '');
		socket.emit('pauseTimer');
	});

  $('#resume-timer').click(function() {
    $(event.target).prop('disabled', true);
    $('#pause-timer').prop('disabled', '');
    socket.emit('resumeTimer');
  });

	$('#reset-timer').click(function() {
    var seconds = 60000;
		socket.emit('resetTimer', 60000);
	});

  $('#end-round').click(function() {
    var prompt = "Are you sure?"
        buttons = "<div id='cancel-buttons'><p class='confirm-prompt'><b>Are you sure?</b></p><button id='no-cancel' class='btn btn-default'>no</button><button id='yes-cancel' class='btn btn-default'>yes</button></div>";

        $('#end-round').addClass('hidden');
        $('#end-round-wrapper').append(buttons);
  }, confirmRoundCancel());

  ////////////////////////////////////////////////////
  //////// END of button listeners to sockets ///////////////////////////////////////
  ////////////////////////////////////////////////////

  $(document).on('submit', '#answer-to-question-wrapper', function(event) {
    var answer = $('#answer-box').val();
    $('#answer-box').val('');
    event.preventDefault();
    
    $('#answer-to-question-wrapper').addClass('hidden');
    $('#show-answer').removeClass('hidden');
    $('#answer').text(answer);

    socket.emit('submittedAnswer', answer);
  });
});

// FUNCTION: generatePoll(arg[0], arg[1])
// arg[0] = an array of all answers
// arg[1] = an array of all names of players
function generatePoll(answers, names) {
  var returnString = "";
  $.each(answers, function(i, val) {
    returnString = returnString + "<div id='answer-"+i+" form-group'><label for='"+i+"'><h4>"+val+"</h4></label><select class='form-control select-people' id='"+i+"'><option disabled selected value=''>select a user</option>";
    $.each(names, function(socket, name) {
        returnString = returnString + "<option value='"+socket+"'>"+name+"</option>";
    });
    returnString = returnString + "</select></div>";
  });
  if (returnString == "") {return "No one answered the question..."};
  return returnString;
}

function confirmRoundCancel() {
  $(document).on('click', '#yes-cancel', function() {
    socket.emit('cancelRound');
    $('#yes-cancel, #no-cancel, .confirm-prompt').remove();
  });

  $(document).on('click', '#no-cancel', function() {
    $('#end-round').removeClass('hidden');
    $('#yes-cancel, #no-cancel, .confirm-prompt').remove();
  });
}

function refreshRound() {
  //empty timer
  $('#timer').empty();
  //remove questions
  $('#question-box').empty();
  $('#answer-to-question-wrapper').addClass('hidden');
  $('#question-box-wrapper').addClass('hidden');
  //remove answers
  $('#all-answers-for-voting').addClass('hidden');
  $('#answers-header').nextAll().remove();
  //remove own answer
  $('#show-answer').addClass('hidden');
  $('#answer').empty();
  if (isHost) {
    $('#end-round, #resume-timer, #pause-timer, #reset-timer').addClass('hidden');
    $('#resume-timer, #pause-timer').prop('disabled', '');
    $('#start-round').removeClass('hidden');
  }
}

function showScores(array) {
  var returnString = "";
  returnString = returnString + "<div class='panel panel-default'><div class='panel-heading'><b>Scores</b></div><table class='table'>"+
                    "<thead><tr><th>#</th><th>Name</th><th>Score</th></tr></thead><tbody>";

  $.each(array, function(i, person) {
    returnString = returnString + "<tr><th scope='row'>"+(i+1)+"</th><td>"+person.name+"</td><td>"+person.score+"</td></tr>";
  });

  returnString = returnString + "</tbody></table></div>";
  console.log(returnString);
  return returnString;
}