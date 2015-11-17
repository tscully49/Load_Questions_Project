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
  })

	socket.on('startQuestion', function(question) {
    $('#answer-to-question-wrapper').show();
    $('#question-box-wrapper').show();
		$('#question-box').html(question);
	});

  socket.on('endQuestion', function() {
    $('#answer-to-question-wrapper').hide();
    $('#question-box-wrapper').hide();
    $('#question-box').empty();
  });

  socket.on('startVoting', function(answers, names) {
    $('#all-answers-for-voting').removeClass('hidden');
    $('#all-answers-for-voting').append(generatePoll(answers, names));
  });

  socket.on('endVoting', function() {
    $('#all-answers-for-voting').after().empty().hide();
    // loading screen
  });

  socket.on('endRound')

  socket.on('disconnect', function() {
    $('#answer-to-question-wrapper').hide();
    $('#question-box-wrapper').hide();
    if (!$('#all-answers-for-voting').hasClass('hidden')) {
      $('#all-answers-for-voting').addClass('hidden');
    }
    if (!$('#show-answer').hasClass('hidden')) {
      $('#show-answer').addClass('hidden');
    }
    console.log('server-disconnected');
    $('#server-disconnect').empty().append('<div id="server-disconnect">Server Disconnected</div>');
    $('#timer').empty();
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
    if (confirm("Do you want to do this? (this doesn't work yet)")) {
      socket.emit('cancelRound');
      $('#end-round').addClass('hidden');
      $('#resume-timer').addClass('hidden');
      $('#start-round').removeClass('hidden');
      $('#pause-timer').addClass('hidden');
      $('#reset-timer').addClass('hidden');
    }
  });

  ////////////////////////////////////////////////////
  //////// END of button listeners to sockets ///////////////////////////////////////
  ////////////////////////////////////////////////////

  $(document).on('submit', '#answer-to-question-wrapper', function(event) {
    var answer = $('#answer-box').val();
    $('#answer-box').val('');
    event.preventDefault();
    
    $('#answer-to-question-wrapper').hide();
    $('#show-answer').removeClass('hidden');
    $('#answer').text(answer);

    socket.emit('submittedAnswer', answer);
  });
});


function generatePoll(answers, names) {
  var returnString = "";
  $.each(answers, function(i, val) {
    returnString = returnString + "<div id='answer-"+i+" form-group'><label for='option-"+i+"'><h4>"+val+"</h4></label><select class='form-control' id='option-"+i+"'><option disabled selected value=''>select a user</option>";
    for (var j = 0; j < names.length; j++) {
        returnString = returnString + "<option value='"+i+"-"+names[j]+"'>"+names[j]+"</option>";
    }
    returnString = returnString + "</select></div>";
  });
  if (returnString == "") {return "No one answered the question..."};
  return returnString;
}