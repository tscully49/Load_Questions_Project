var util   = require('util'),
	events = require('events'),
	_      = require('underscore');

function Stopwatch() {
	if (false === (this instanceof Stopwatch)) {
		return new Stopwatch();
	}

	console.log("WATCH CREATED");

	this.hour = 3600000;
	this.minute = 60000;
	this.second = 1000;
	this.time = this.minute; // make this available to be dynamic
	this.interval = undefined;

	events.EventEmitter.call(this);

	_.bindAll(this, 'start', 'stop', 'reset', 'onTick');
};

util.inherits(Stopwatch, events.EventEmitter);

Stopwatch.prototype.start = function() {
	console.log("Starting the Timer!");
	this.interval = setInterval(this.onTick, this.second);
	this.emit('start');
};

Stopwatch.prototype.stop = function() {
	console.log('Stopping Timer');
	if (this.interval) {
		clearInterval(this.interval);
		this.emit('stop');
	}
};

Stopwatch.prototype.reset = function() {
	console.log('Reset timer');
	this.time = this.hour; // make this dynamic??? MAKE A FUNCTION WHICH SETS TIMER LENGTH
	this.emit('reset');
};

Stopwatch.prototype.onTick = function() {
	var remainder = this.time,
		numhours,
		numMinutes,
		numSeconds,
		output = "";

	numHours = String(parseInt(remainder / this.hour, 10));
	remainder -= this.hour * numHours;

	numMinutes = String(parseInt(remainder / this.minute, 10));
	remainder -= this.minute * numMinutes;

	numSeconds = String(parseInt(remainder / this.second, 10));

	output = _.map([numHours, numMinutes, numSeconds], function(str) {
        if (str.length === 1) {
            str = "0" + str;
        }
        return str;
    }).join(":");

    this.emit('tick', output);
    this.time -= this.second;

    if (this.time === 0) {
		this.stop();
		return;
	}
}

module.exports = Stopwatch;