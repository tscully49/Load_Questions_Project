var socket;

$(document).ready(function() {
	socket = io(); // window.location.hostname

	socket.on('timer', function (data) {
		$('#timer').html(data.countdown);
	});

	$('#start-timer').click(function() {
		socket.emit('startTimer');
	});

	$('#stop-timer').click(function() {
		socket.emit('stopTimer');
	});

	$('#reset-timer').click(function() {
		socket.emit('resetTimer');
	});
});