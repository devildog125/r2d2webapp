/* 
 * Robot Webinterface - Main Script
 * V1.0, 18th July 2021
 */


// Control speed at which gamepad
// can move the arms and head
var armsMultiplier = 6;
var headMultiplier = 5;

// Runtime variables to manage the gamepad
var moveXY = [0,0,0,0];
var moveYP = [0,0,0,0];
var moveArms = [0,50,0,50];
var moveHead = [50,50];
var gamepadTimer;
var gamePadActive = 0;
var jsJoystick;

// Timer to periodically check if Arduino has sent a message
var arduinoTimer;


/*
 * Update Web-Interface Settings
 */
function sendSettings(type, value) {
	
	// If shutdown is requested, show a confirmation prompt
	if (type=="shutdown") {
		if (!confirm("Are you sure you want to shutdown?")) {
			return 0;
		}
	}
	if (type=="reboot"){
		if (!confirm("Are you sure you want to reboot?")){
			return 0;
		}
	}
	
	//alert(type + ", " + value);
	// Send data to python app, so that it can be passed on
	$.ajax({
		url: "/settings",
		type: "POST",
		data: {"type" : type, "value": value},
		dataType: "json",
		success: function(data){
			// If a response is received from the python backend, but it contains an error
			if(data.status == "Error"){
				showAlert(1, 'Error!', data.msg, 1);
				return 0;
			
			// Else if response is all good
			} else {
				showAlert(0, 'Success!', 'Settings have been updated.', 1);
				return 1;
			}
		},
		error: function(error) {
			// If no response was recevied from the python backend, show an "unknown" error
			if (type == "shutdown") {
				showAlert(0, 'Raspberry Pi is now shutting down!', 'The R2D2 web-interface is no longer active.', 1);
			} else {
				showAlert(1, 'Unknown Error!', 'Unable to update settings.', 1);
			}
			return 0;
		}
	});
}

/*
 * Play a servo motor animation
 */
function anime(clip, time) {
	$.ajax({
		url: "/animate",
		type: "POST",
		data: {"clip": clip},
		dataType: "json",
		beforeSend: function(){
			// Reset the animation progress bar
			$('#anime-progress').stop();
			$('#anime-progress').css('width', '0%').attr('aria-valuenow', 0);
		},
		success: function(data){
			// If a response is received from the python backend, but it contains an error
			if(data.status == "Error"){
				$('#anime-progress').addClass('bg-danger');
				$('#anime-progress').css("width", "0%").animate({width: 100+"%"}, 500);
				showAlert(1, 'Error!', data.msg, 1);
				return false;
				
			// Otherwise set the progress bar to show the animation progress
			} else {
				$('#anime-progress').removeClass('bg-danger');
				$('#anime-progress').css("width", "0%").animate({width: 100+"%"}, time*1000);
				return true;
			}
		},
		error: function(error) {
			// If no response was recevied from the python backend, show an "unknown" error
			$('#anime-progress').addClass('bg-danger');
			$('#anime-progress').css("width", "0%").animate({width: 100+"%"}, 500);
			showAlert(1, 'Unknown Error!', 'Unable to run the animation.', 1);
			return false;
		}
	});
}


/*
 * Play an audio clip
 */
function playAudio(clip, time) {
	$.ajax({
		url: "/audio",
		type: "POST",
		data: {"clip": clip},
		dataType: "json",
		beforeSend: function(){
			// Reset the audio progress bar
			$('#audio-progress').stop();
			$('#audio-progress').css('width', '0%').attr('aria-valuenow', 0);
		},
		success: function(data){
			// If a response is received from the python backend, but it contains an error
			if(data.status == "Error"){
				$('#audio-progress').addClass('bg-danger');
				$('#audio-progress').css("width", "0%").animate({width: 100+"%"}, 500);
				showAlert(1, 'Error!', data.msg, 1);
				return false;
				
			// Otherwise set the progress bar to show the audio clip progress
			} else {
				$('#audio-progress').removeClass('bg-danger');
				$('#audio-progress').css("width", "0%").animate({width: 100+"%"}, time*1000);
				return true;
			}
		},
		error: function(error) {
			// If no response was recevied from the python backend, show an "unknown" error
			$('#audio-progress').addClass('bg-danger');
			$('#audio-progress').css("width", "0%").animate({width: 100+"%"}, 500);
			showAlert(1, 'Unknown Error!', 'Unable to play audio file.', 1);
			return false;
		}
	});
}


/*
 * Send a manual servo control command
 */
function servoControl(item, servo, value) {
	$.ajax({
		url: "/servoControl",
		type: "POST",
		data: {"servo": servo, "value": value},
		dataType: "json",
		success: function(data){
			// If a response is received from the python backend, but it contains an error
			if(data.status == "Error"){
				item.value = item.oldvalue;
				showAlert(1, 'Error!', data.msg, 0);
				return false;
				
			// Otherwise ensure that current value is correctly updated
			} else {
				item.value = value;
				item.oldvalue = value;
				return true;
			}
		},
		error: function(error) {
			// If no response was recevied from the python backend, show an "unknown" error
			showAlert(1, 'Unknown Error!', 'Unable to update servo position.', 1);
			return false;
		}
	});
}


/*
 * Send a preset servo control command
 */
function servoPresets(item, preset, servo) {
	
	// Only run this if the button is not disabled
	if (!item.classList.contains('disabled')) {
		$.ajax({
			url: "/servoControl",
			type: "POST",
			data: {"servo": servo, "value": 0},
			dataType: "json",
			success: function(data){
				// If a response is received from the python backend, but it contains an error
				if(data.status == "Error"){
					showAlert(1, 'Error!', data.msg, 1);
					return false;
				
				// Otherwise, update the manual servo control sliders to reflect the current position
				} else {
					if (preset == "head-up") {
						$('#neck-top').oldvalue = $('#neck-top').value;
						$('#neck-bottom').oldvalue = $('#neck-bottom').value;
						$('#neck-top').val(0);
						$('#neck-bottom').val(50);
					} else if (preset == "head-neutral") {
						$('#neck-top').oldvalue = $('#neck-top').value;
						$('#neck-bottom').oldvalue = $('#neck-bottom').value;
						$('#neck-top').val(100);
						$('#neck-bottom').val(0);
					} else if (preset == "head-down") {
						$('#neck-top').oldvalue = $('#neck-top').value;
						$('#neck-bottom').oldvalue = $('#neck-bottom').value;
						$('#neck-top').val(0);
						$('#neck-bottom').val(0);
					} else if (preset == "arms-left") {
						$('#arm-left').oldvalue = $('#arm-left').value;
						$('#arm-right').oldvalue = $('#arm-right').value;
						$('#arm-left').val(100);
						$('#arm-right').val(0);
					} else if (preset == "arms-neutral") {
						$('#arm-left').oldvalue = $('#arm-left').value;
						$('#arm-right').oldvalue = $('#arm-right').value;
						$('#arm-left').val(50);
						$('#arm-right').val(50);
					} else if (preset == "arms-right") {
						$('#arm-left').oldvalue = $('#arm-left').value;
						$('#arm-right').oldvalue = $('#arm-right').value;
						$('#arm-left').val(0);
						$('#arm-right').val(100);
					} else if (preset == "eyes-left") {
						$('#eye-left').oldvalue = $('#eye-left').value;
						$('#eye-right').oldvalue = $('#eye-right').value;
						$('#eye-left').val(0);
						$('#eye-right').val(100);
					} else if (preset == "eyes-neutral") {
						$('#eye-left').oldvalue = $('#eye-left').value;
						$('#eye-right').oldvalue = $('#eye-right').value;
						$('#eye-left').val(40);
						$('#eye-right').val(40);
					} else if (preset == "eyes-sad") {
						$('#eye-left').oldvalue = $('#eye-left').value;
						$('#eye-right').oldvalue = $('#eye-right').value;

						$('#eye-left').val(0);
						$('#eye-right').val(0);
					} else if (preset == "eyes-right") {
						$('#eye-left').oldvalue = $('#eye-left').value;
						$('#eye-right').oldvalue = $('#eye-right').value;
						$('#eye-left').val(100);
						$('#eye-right').val(0);
					}
					return true;
				}
			},
			error: function(error) {
				// If no response was recevied from the python backend, show an "unknown" error
				showAlert(1, 'Unknown Error!', 'Unable to update servo position.', 1);
				return false;
			}
		});
	}
}


/*
 * Enable/disable manual servo inputs depending on whether
 * the manual or automatic servo mode is selected
 */
function servoInputs(enabled) {
	if (enabled == 1) {
		$('#head-rotation').prop('disabled', false);
		$('#neck-top').prop('disabled', false);
		$('#neck-bottom').prop('disabled', false);
		$('#eye-left').prop('disabled', false);
		$('#eye-right').prop('disabled', false);
		$('#arm-left').prop('disabled', false);
		$('#arm-right').prop('disabled', false);
		$('#head-up').removeClass('disabled');
		$('#head-neutral').removeClass('disabled');
		$('#head-down').removeClass('disabled');
		$('#arms-left').removeClass('disabled');
		$('#arms-neutral').removeClass('disabled');
		$('#arms-right').removeClass('disabled');
		$('#eyes-sad').removeClass('disabled');
		$('#eyes-left').removeClass('disabled');
		$('#eyes-neutral').removeClass('disabled');
		$('#eyes-right').removeClass('disabled');
	} else {
		$('#head-rotation').prop('disabled',true);
		$('#neck-top').prop('disabled',true);
		$('#neck-bottom').prop('disabled',true);
		$('#eye-left').prop('disabled',true);
		$('#eye-right').prop('disabled',true);
		$('#arm-left').prop('disabled',true);
		$('#arm-right').prop('disabled',true);
		$('#head-up').addClass('disabled');
		$('#head-neutral').addClass('disabled');
		$('#head-down').addClass('disabled');
		$('#arms-left').addClass('disabled');
		$('#arms-neutral').addClass('disabled');
		$('#arms-right').addClass('disabled');
		$('#eyes-sad').addClass('disabled');
		$('#eyes-left').addClass('disabled');
		$('#eyes-neutral').addClass('disabled');
		$('#eyes-right').addClass('disabled');
	}
}

/*
 * Gamepad Functions go here!
 */
// Turn on controller support
function controllerOn() {
	if (gamePadActive == 0) {
		$('#cont-area').removeClass('d-none');
		resetInfo();
		joypad.set({ axisMovementThreshold: 0.2 });
		joypad.on('connect', e => updateInfo(e));
		joypad.on('disconnect', e => resetInfo(e));
		joypad.on('axis_move', e => {
			console.log(e.detail);
			return moveAxis(e);
		});
		joypad.on('button_press', e => {
			console.log(e.detail);
			return pressButton(e);
		});	
		moveXY[0] = 0;
		moveXY[2] = 0;
		gamePadActive = 1;
	}
}


// When controller is disconnected
function resetInfo(e) {
	if (gamePadActive == 1) {
		$('#cont-area').attr('data-original-title','Disconnected');
		$('#cont-area').addClass('bg-danger');
		$('#cont-area').removeClass('bg-success');
		//$('#joystick').removeClass('d-none');
		clearInterval(gamepadTimer);
		moveXY[0] = 0;
		moveXY[2] = 0;
		sendMovementValues();
		gamePadActive = 0;
	}
}

// When a new controller is connected
function updateInfo(e) {
	const { gamepad } = e;
	$('#cont-area').attr('data-original-title','Connected');
	$('#cont-area').removeClass('bg-danger');
	$('#cont-area').addClass('bg-success');
	//$('#joystick').addClass('d-none');
	gamepadTimer = setInterval(sendMovementValues, 100); 
}

// When a controller axis movement is detected
function moveAxis(e) {
	const { axis, axisMovementValue } = e.detail;
	
	if (axis === 0) {
		moveXY[0] = axisMovementValue;
	} else if (axis === 1) {
		moveXY[2] = axisMovementValue;
	} else if (axis === 2) {
		moveYP[0] = axisMovementValue;
	} else if (axis === 3) {
		moveYP[2] = axisMovementValue;
	} 
}

// Send the movement values at fixed intervals
function sendMovementValues() {
	
	// X or Y motor movement
	if (moveXY[0] != moveXY[1] || moveXY[2] != moveXY[3]) {
		
		// X-axis (left/right turning)
		if (moveXY[0] != moveXY[1]) moveXY[1] = moveXY[0];
		else moveXY[0] = 0;
		
		// Y-axis (forward/reverse movement)
		if (moveXY[2] != moveXY[3]) moveXY[3] = moveXY[2];
		else moveXY[2] = 0;
		
		$('#joytext').html('x: ' + Math.round(moveXY[1]*100) + ', y: ' + Math.round(moveXY[3]*-100));
		
		// Send data to python app, so that it can be passed on
		$.ajax({
			url: "/motor",
			type: "POST",
			data: {"stickX": moveXY[1], "stickY": -moveXY[3]},
			dataType: "json",
			success: function(data){
				if(data.status == "Error"){
					showAlert(1, 'Error!', data.msg, 0);
				} else {
					// Do nothing
				}
			},
			error: function(error) {
				showAlert(1, 'Unknown Error!', 'Could not send movement command.', 0);
			}
		});
	} else {
		moveXY[0] = 0;
		moveXY[2] = 0;
	}
	
	// Yaw Axis (head rotation left/right)
	if (moveYP[0] != moveYP[1]) {
		moveYP[1] = moveYP[0];
	} else moveYP[0] = 0;
	if (moveYP[1] != 0) {
		moveHead[0] += moveYP[1] * headMultiplier;
		if (moveHead[0] > 100) moveHead[0] = 100;
		else if (moveHead[0] < 0) moveHead[0] = 0;
		servoControl(document.getElementById('head-rotation'), 'G', Math.round(moveHead[0]));
	}
	
	
	// Pitch Axis (head tilt up/down)
	if (moveYP[2] != moveYP[3]) {
		moveYP[3] = moveYP[2];
	} else moveYP[2] = 0;
	if (moveYP[3] != 0) {
		moveHead[1] += moveYP[3] * headMultiplier;
		if (moveHead[1] > 200) moveHead[1] = 200;
		else if (moveHead[1] < 0) moveHead[1] = 0;
		if (moveHead[1] < 100) {
			servoControl(document.getElementById('neck-top'), 'T', Math.round(moveHead[1]));
			servoControl(document.getElementById('neck-bottom'), 'B', 0);
		} else if (moveHead[1] < 160) {
			servoControl(document.getElementById('neck-top'), 'T', Math.round(200 - moveHead[1]));
			servoControl(document.getElementById('neck-bottom'), 'B', Math.round(moveHead[1] - 100));
		} else {
			servoControl(document.getElementById('neck-top'), 'T', Math.round(moveHead[1]) - 110);
			servoControl(document.getElementById('neck-bottom'), 'B', 60);
		}
	}

	// Left Arm
	if (moveArms[0] != 0) {
		moveArms[1] += moveArms[0] * armsMultiplier;
		if (moveArms[1] > 100) moveArms[1] = 100;
		else if (moveArms[1] < 0) moveArms[1] = 0;
		servoControl(document.getElementById('arm-left'), 'L', Math.round(moveArms[1]));
		if ((moveArms[0] == -1) && (typeof joypad.buttonEvents.joypad[0].button_6 == 'undefined' || !joypad.buttonEvents.joypad[0].button_6.hold)) moveArms[0] = 0;
		else if ((moveArms[0] == 1) && (typeof joypad.buttonEvents.joypad[0].button_4 == 'undefined' || !joypad.buttonEvents.joypad[0].button_4.hold)) moveArms[0] = 0;
	}
	
	// Right Arm
	if (moveArms[2] != 0) {
		moveArms[3] += moveArms[2] * armsMultiplier;
		if (moveArms[3] > 100) moveArms[3] = 100;
		else if (moveArms[3] < 0) moveArms[3] = 0;
		servoControl(document.getElementById('arm-right'), 'R', Math.round(moveArms[3]));
		if ((moveArms[2] == -1) && (typeof joypad.buttonEvents.joypad[0].button_7 == 'undefined' || !joypad.buttonEvents.joypad[0].button_7.hold)) moveArms[2] = 0;
		else if ((moveArms[2] == 1) && (typeof joypad.buttonEvents.joypad[0].button_5 == 'undefined' || !joypad.buttonEvents.joypad[0].button_5.hold)) moveArms[2] = 0;
	}
}


/*
 * This function is run once when the page is loading
 */
window.onload = function () { 
	var h = window.innerHeight - 100;
	var cw = $('#limit').width();
	var pointer = 80;
	
	if (h > cw) {
		$('#limit').css({'height':cw+'px'});
	} else {
		$('#limit').css({'height':h+'px'});
		$('#limit').css({'width':h+'px'});
		pointer = 60;
		$('#base').css({'width':pointer+'px'});
		$('#base').css({'height':pointer+'px'});
		$('#stick').css({'width':pointer+'px'});
		$('#stick').css({'height':pointer+'px'});
		cw = h;
	}
	$('#stick').css({'top':Math.round(cw/2-pointer/2)+'px'});
	$('#stick').css({'left':Math.round(cw/2-pointer/2)+'px'});
	$('#base').css({'top':Math.round(cw/2-pointer/2)+'px'});
	$('#base').css({'left':Math.round(cw/2-pointer/2)+'px'});

	var offsets = document.getElementById('limit').getBoundingClientRect();
	var top = offsets.top;
	var left = offsets.left;
	
	jsJoystick = new VirtualJoystick({
		mouseSupport: true,
		stationaryBase: true,
		baseX: left+(cw/2),
		baseY: top+(cw/2),
		center: (cw/2),
		limitStickTravel: true,
		stickRadius: Math.round(cw/2) - pointer/2,
		container: document.getElementById('limit'),
		stickElement: document.getElementById('stick'),
		//baseElement: document.getElementById('base'),
		useCssTransform: true,
		updateText: document.getElementById('joytext')
	});
}


/*
 * This function is run when the window is resized
 */
$(window).resize(function () {
	var h = window.innerHeight - 100;
	var w = window.innerWidth;
	var cw = (w - 30) * 0.8;
	if (w > 767) cw = ((w / 2) - 30) * 0.8;
	if (cw > 500) cw = 500;
	var pointer = 80;
	
	if (h < cw) {
		cw = h;
		pointer = 60;
	}
	
	$('#limit').css({'height':cw+'px'});
	$('#limit').css({'width':cw+'px'});
	$('#base').css({'width':pointer+'px'});
	$('#base').css({'height':pointer+'px'});
	$('#stick').css({'width':pointer+'px'});
	$('#stick').css({'height':pointer+'px'});
	$('#stick').css({'top':Math.round(cw/2-pointer/2)+'px'});
	$('#stick').css({'left':Math.round(cw/2-pointer/2)+'px'});
	$('#base').css({'top':Math.round(cw/2-pointer/2)+'px'});
	$('#base').css({'left':Math.round(cw/2-pointer/2)+'px'});

	var middleX = w / 2;
	if (w > 767) middleX += w / 4;
	var middleY = 40 + 30 + cw / 2;
	
	jsJoystick.updateDimensions(middleX, middleY, (cw/2), Math.round(cw/2) - pointer/2);
});


/*
 * This function is run once when the page has finished loading
 */
$(document).ready(function () {

	$(function () {
	  $('[data-toggle="tooltip"]').tooltip()
	})

	controllerOn();
	if (joypad.instances[0] != null && joypad.instances[0].connected) updateInfo(joypad.instances[0]);
	
	// This function runs when a number is inserted into the motor-offset
	// input box, and ensures the number is valid.
	$('#motor-offset').bind('keyup input', function(){
		var regex=/^[0-9]+$/;
    	var val1 = $('#motor-offset').val();
    	var val2 = $('#steer-offset').val();
    	$('#motor-offset').removeClass('is-valid');
    	$('#motor-offset').removeClass('is-invalid');
    	if(!val1.match(regex) || !val2.match(regex) || val1 > 250 || val1 < 0 || val2 > 100 || val2 < -100) $('#num-update').addClass('disabled');
    	else $('#num-update').removeClass('disabled');
	});

	// This function runs when a number is inserted into the steering-offset
	// input box, and ensures the number is valid.
	$('#steer-offset').bind('keyup input', function(){
		var regex=/^[0-9]+$/;
    	var val1 = $('#motor-offset').val();
    	var val2 = $('#steer-offset').val();
    	$('#steer-offset').removeClass('is-valid');
    	$('#steer-offset').removeClass('is-invalid');
    	if(!val1.match(regex) || !val2.match(regex) || val1 > 250 || val1 < 0 || val2 > 100 || val2 < -100) $('#num-update').addClass('disabled');
    	else $('#num-update').removeClass('disabled');
	});

	$('#num-update').click(function(){
		if(!$('#num-update').hasClass('disabled')){
			var val1 = $('#motor-offset').val();
	    	var val2 = $('#steer-offset').val();
	    	sendSettings("motorOff", val1);
	    	if($('#alert-space > div').hasClass('alert-danger')) {
	    		$('#motor-offset').removeClass('is-valid');
	    		$('#motor-offset').addClass('is-invalid');
	    	} else {
	    		$('#motor-offset').removeClass('is-invalid');
	    		$('#motor-offset').addClass('is-valid');
	    	}
	    	sendSettings("steerOff", val2);
	    	if($('#alert-space > div').hasClass('alert-danger')) {
	    		$('#steer-offset').removeClass('is-valid');
	    		$('#steer-offset').addClass('is-invalid');
	    	} else {
	    		$('#steer-offset').removeClass('is-invalid');
	    		$('#steer-offset').addClass('is-valid');
	    	}
	    }
	});
});
