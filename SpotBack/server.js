//#region [ rgba(255, 000, 000, 0.15) ] SPOTLIGHT CONSTANTS!

//SPOTLIGHT POSITION
const SPOTLIGHT_X = 4.529
const SPOTLIGHT_Y = 1.507
const SPOTLIGHT_HEIGHT = 1.5
const MAC_OF_TAG_TO_SHINE = '842E1431C72F'

//DMX Constants
const YAW_COEFF = 2.117
const PITCH_COEFF = .705

//DMX Colors
const COLOR_RED = 10
const COLOR_WHITE = 0
const COLOR_BLUE = 30
const COLOR_CYAN = 70
const COLOR_GREEN = 40
const COLOR_ORANGE = 50
const COLOR_PURPLE = 60
const COLOR_YELLOW = 20

//#endregion

//#region [ rgba(000, 255, 000, 0.15) ] DEPENDENCIES: DMX, EXPRESS, MQTT!
const DMXDevice = require('enttec-open-dmx-usb').EnttecOpenDMXUSBDevice
const express = require('express');
const cors = require('cors');
var mqtt = require('mqtt');

//set up express app
const app = express();
const port = process.env.PORT || 5000

//set up mqtt subscriber
const MQTT_URI = 'mqtt://localhost:1883'
const testTopic = `silabs/aoa/angle/ble-pd-${MAC_OF_TAG_TO_SHINE}`;
const topicFormat = "silabs/aoa/angle/"
var mqttClient = mqtt.connect(MQTT_URI)

//assign middleware
app.use(cors());
app.use(express.json());
//#endregion

//#region [ rgba(000, 000, 255, 0.15) ] DMX DISCOVERY!
var spotlight = {};
try {
    DMXDevice.listDevices().then((promise) => {
        promise.forEach((path) => {
            spotlight = {
                x: SPOTLIGHT_X,
                y: SPOTLIGHT_Y,
                height: SPOTLIGHT_HEIGHT,
                spotlightOffset: '0',
                assignedTag: '842E1431C72A',
                channels: new DMXDevice(path)
            }    
        console.log(spotlight);
        })
    }).catch((err) => { console.log(err) })
} catch {
    console.log('Device Discovery Failed.')
}
//#endregion

//#region [ rgba(255, 255, 000, 0.15) ] TRIGONOMETRY!
function calculateYawAngle(targetX, targetY,  spotlightX, spotlightY) {
    var opposite = Math.abs(spotlightX - targetX)
    var adjacent = Math.abs(spotlightY - targetY)
    var arcTan = (Math.atan(opposite / adjacent) * (180 / Math.PI))
    //console.log("Yaw Angle: " + arcTan)
    return arcTan
}
function calculatePitchAngle(targetX, targetY, spotlightX, spotlightY) {
    var opposite = Math.abs(spotlightX - targetX)
    var adjacent = Math.abs(spotlightY - targetY)
    var hypotenuse = Math.sqrt(Math.pow(opposite, 2) + Math.pow(adjacent, 2))
    var arcTan = (Math.atan(hypotenuse / spotlight.height) * (180 / Math.PI))
    //console.log("Pitch Angle: " + arcTan)
    return arcTan
}
function calculateSpotlightMovement(targetX, targetY) {
    //temp vars
    var yaw = 0
    var pitch = 0
    var color = COLOR_WHITE
    if (targetY <= spotlight.y && targetX > spotlight.x) {
        //console.log('top right of screen')
        yaw = Math.floor(calculateYawAngle(targetX, targetY, spotlight.x, spotlight.y) / YAW_COEFF)
        pitch = 128 - Math.floor(calculatePitchAngle(targetX, targetY, spotlight.x, spotlight.y) / PITCH_COEFF)
    } else if (targetY > spotlight.y && targetX > spotlight.x) {
        //console.log('bot right of screen')
        yaw = 43 + (43 - (Math.floor(calculateYawAngle(targetX, targetY, spotlight.x, spotlight.y) / YAW_COEFF)))
        pitch = 128 - Math.floor(calculatePitchAngle(targetX, targetY, spotlight.x, spotlight.y) / PITCH_COEFF)
    } else if (targetY <= spotlight.y && targetX <= spotlight.x) {
        //console.log('top left of screen')
        yaw = 43 + (43 - (Math.floor(calculateYawAngle(targetX, targetY, spotlight.x, spotlight.y) / YAW_COEFF)))
        pitch = 128 + Math.floor(calculatePitchAngle(targetX, targetY, spotlight.x, spotlight.y) / PITCH_COEFF)
    } else if (targetY > spotlight.y && targetX <= spotlight.x) {
        //console.log('bot left of screen')
        yaw = Math.floor(calculateYawAngle(targetX, targetY, spotlight.x, spotlight.y) / YAW_COEFF)
        pitch = 128 + Math.floor(calculatePitchAngle(targetX, targetY, spotlight) / PITCH_COEFF)
    }

    //90 DEGREE OFFSET CALIBRATION
    if (spotlight.spotlightOffset == '90') {
        yaw += 42
    } else if (spotlight.spotlightOffset == '180') {
        yaw += 84
    } else if (spotlight.spotlightOffset == '270') {
        yaw -= 42
    }

    return [yaw, pitch];
}
//#endregion

//#region [ rgba(000, 255, 255, 0.15) ] HTTP ROUTES!
app.route('/api/move/:id').post((req, res) => {
    try {
        console.log('Command for Spotlight '  + req.body.x.toFixed(2) + "m " + req.body.y.toFixed(2) + "m.")
        yawPitch = [0,0]
        yawPitch = calculateSpotlightMovement(req.body.x, req.body.y)
        spotlight.channels.setChannels({
            1: yawPitch[0],
            2: 0, //yaw fine tune
            3: yawPitch[1],
            4: 0, //pitch fine tune
            5: 0, //gobo
            6: COLOR_WHITE,
            7: 0, //strobe
            8: 30, //req.body.lum
            9: 0
        }, true) //TEST
        res.status(200).send({ message: "Ok" })
    } catch (error) {
        res.status(500).send({ message: "Error. Spotlight not initialized. " + error })
    }
});
app.listen(port, () => {
    console.log(`Listening on port ${port}.`)
});
//#endregion

//#region [ rgba(255, 000, 255, 0.15) ] MQTT ROUTES!
mqttClient.on("connect", () => {
    console.log('mqtt connected')
})
mqttClient.on("error", () => {
    console.log('mqtt error')
})
mqttClient.subscribe([testTopic], { qos: 2 });
mqttClient.on('message', (topic, message, packet) => {
    var targetCoordinates = JSON.parse(message.toString())
    console.log(targetCoordinates);
    yawPitch = calculateSpotlightMovement(targetCoordinates.x, targetCoordinates.y)
    spotlightToMove.device.setChannels({
        1: yawPitch[0],
        2: 0, //yaw fine tune
        3: yawPitch[1],
        4: 0, //pitch fine tune
        5: 0, //gobo
        6: COLOR_WHITE, //gobo
        7: 0, //strobe
        8: 20, //req.body.lum
        9: 0
    }, true)
})
//#endregion