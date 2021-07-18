#############################################
# R2D2 Web-interface
#
# @author     Tyler Vaught
# @copyright  Copyright (C) 2020 - Distributed under MIT license
# @version    1.0
# @date       18th July 2021
#############################################

from flask import Flask, request, session, redirect, url_for, jsonify, render_template
import os
import pygame		# for sound
import subprocess 	# for shell commands

app = Flask(__name__)


##### VARIABLES WHICH YOU CAN MODIFY #####
soundFolder = "/home/pi/r2d2_interface/static/sounds/"  # Location of the folder containing all audio files
##########################################


# Start sound mixer
pygame.mixer.init()

# Set up runtime variables and queues
exitFlag = 0
volume = 5
batteryLevel = -999


#############################################
# Flask Pages and Functions
#############################################

##
# Show the main web-interface page
#
@app.route('/')
def index():
    # if session.get('active') != True:
        # return redirect(url_for('login'))

    # Get list of audio files
    files = []
    for item in sorted(os.listdir(soundFolder)):
        if item.endswith(".ogg"):
            audiofiles = os.path.splitext(os.path.basename(item))[0]

            # Set up default details
            audiogroup = "Other"
            audionames = audiofiles;
            audiotimes = 0;

            # Get item details from name, and make sure they are valid
            if len(audiofiles.split('_')) == 2:
                if audiofiles.split('_')[1].isdigit():
                    audionames = audiofiles.split('_')[0]
                    audiotimes = float(audiofiles.split('_')[1])/1000.0
                else:
                    audiogroup = audiofiles.split('_')[0]
                    audionames = audiofiles.split('_')[1]
            elif len(audiofiles.split('_')) == 3:
                audiogroup = audiofiles.split('_')[0]
                audionames = audiofiles.split('_')[1]
                if audiofiles.split('_')[2].isdigit():
                    audiotimes = float(audiofiles.split('_')[2])/1000.0

            # Add the details to the list
            files.append((audiogroup,audiofiles,audionames,audiotimes))

    return render_template('index.html',sounds=files)


##
# Show the Login page
#
@app.route('/login')
def login():
        return redirect(url_for('index'))

##
# Control the main movement motors
#
@app.route('/motor', methods=['POST'])
def motor():

    stickX =  request.form.get('stickX')
    stickY =  request.form.get('stickY')

    if stickX is not None and stickY is not None:
        xVal = int(float(stickX)*100)
        yVal = int(float(stickY)*100)
        print("Motors:", xVal, ",", yVal)
        #  TODO: add motor functionality here
        return jsonify({'status': 'OK' })
    else:
        print("Error: unable to read POST data from motor command")
        return jsonify({'status': 'Error','msg':'Unable to read POST data'})


##
# Update Settings
#
@app.route('/settings', methods=['POST'])
def settings():

    thing = request.form.get('type');
    value = request.form.get('value');

    if thing is not None and value is not None:
        # Motor deadzone threshold
        if thing == "motorOff":
            print("Motor Offset:", value)
        #  TODO: add Motor Offset setting functionality

        # Motor steering offset/trim
        elif thing == "steerOff":
            print("Steering Offset:", value)
        #  TODO: add Motor Offset setting functionality

        # Automatic/manual animation mode
        elif thing == "animeMode":
            print("Animation Mode:", value)
        #  TODO: add Servo Animation Mode On/Off setting functionality


        # Sound mode currently doesn't do anything
        elif thing == "soundMode":
            print("Sound Mode:", value)
        #  TODO: add Sound Mode On/Off setting functionality

        # Change the sound effects volume
        elif thing == "volume":
            print("Value Model:")
        #  TODO: Add Volume settings

        # Shut down the Raspberry Pi
        elif thing == "reboot":
            print("Restarting Raspberry Pi!", value)
            result = subprocess.run(['sudo','nohup','reboot','-h','now'], stdout=subprocess.PIPE).stdout.decode('utf-8')
            return jsonify({'status': 'OK','msg': 'Raspberry Pi is restarting'})

        # Shut down the Raspberry Pi
        elif thing == "shutdown":
            print("Shutting down Raspberry Pi!", value)
            result = subprocess.run(['sudo','nohup','shutdown','-h','now'], stdout=subprocess.PIPE).stdout.decode('utf-8')
            return jsonify({'status': 'OK','msg': 'Raspberry Pi is shutting down'})

        # Unknown command
        else:
            return jsonify({'status': 'Error','msg': 'Unable to read POST data'})

        return jsonify({'status': 'OK' })
    else:
        return jsonify({'status': 'Error','msg': 'Unable to read POST data'})


##
# Play an Audio clip on the Raspberry Pi
#
@app.route('/audio', methods=['POST'])
def audio():


    clip =  request.form.get('clip')
    if clip is not None:
        clip = soundFolder + clip + ".ogg"
        print("Play music clip:", clip)
        pygame.mixer.music.load(clip)
        pygame.mixer.music.set_volume(volume/10.0)
        #start_time = time.time()
        pygame.mixer.music.play()
        #while pygame.mixer.music.get_busy() == True:
        #	continue
        #elapsed_time = time.time() - start_time
        #print(elapsed_time)
        return jsonify({'status': 'OK' })
    else:
        return jsonify({'status': 'Error','msg':'Unable to read POST data'})


##
# Send an Animation command to the Arduino
#
@app.route('/animate', methods=['POST'])
def animate():
    clip = request.form.get('clip')
    if clip is not None:
        print("Animate:", clip)
        #  Todo Add Animation servo settings here
        return jsonify({'status': 'OK' })
    else:
        return jsonify({'status': 'Error','msg':'Unable to read POST data'})


##
# Send a Servo Control command to the Arduino
#
@app.route('/servoControl', methods=['POST'])
def servoControl():
    servo = request.form.get('servo');
    value = request.form.get('value');
    if servo is not None and value is not None:
        print("servo:", servo)
        print("value:", value)
        #  Todo Add Animation servo settings here
        return jsonify({'status': 'OK' })
    else:
        return jsonify({'status': 'Error','msg':'Unable to read POST data'})



##
# Program start code, which initialises the web-interface
#
if __name__ == '__main__':
    #app.run()
    app.run(debug=False, host='0.0.0.0')
