var socket;
var isHost = false;

$(document).ready(function() {
	socket = io(); // window.location.hostname
  $('#timer-buttons').hide();
  $('#host-banner').hide();

  // Socket listeners //
	socket.on('timer', function (data) {
		$('#timer').html(data.countdown);
	});

  socket.on('isHost', function() {
    $('#timer-buttons').show();
    $('#host-banner').show();
  })

	socket.on('currentQuestion', function(question) {
		$('#question-box').html(question);
	});

    // Starts the timer and show all of the answers with a drop down for each person to choose
  socket.on('startVoting', function(answers, names) {    
    $('#all-answers-for-voting').append(generatePoll(answers, names));
  });
  // end of socket listeners //

  // Button event listeners that will emit to sockets //
	$('#start-timer').click(function() {
		socket.emit('startTimer');
	});

	$('#stop-timer').click(function() {
		socket.emit('stopTimer');
	});

	$('#reset-timer').click(function() {
		socket.emit('resetTimer');
	});
  // end of butto listeners to sockets // 

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
    returnString = returnString + "<div id='answer-"+i+" form-group'><label for='option-"+i+"'><h4>"+val+"</h4></label><select class='form-control' id='option-"+i+"'>";
    for (var j = 0; j < names.length; j++) {
        returnString = returnString + "<option value='"+i+"-"+names[j]+"'>"+names[j]+"</option>";
    }
    returnString = returnString + "</select></div>";
  });
  return returnString;
}