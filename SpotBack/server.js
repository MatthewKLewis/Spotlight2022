//#region [ rgba(255, 000, 000, 0.15) ] SPOTLIGHT CONSTANTS!

//SPOTLIGHT POSITION
const SPOTLIGHT_X = 4.529
const SPOTLIGHT_Y = 1.507
const SPOTLIGHT_HEIGHT = 3.048
const SPOTLIGHT_START_ANGLE = 45;
const MAC_OF_TAG_TO_SHINE = '842E1431C72F'

//DMX Trigonometry Conversion Constants
const YAW_COEFF = 2.117
const PITCH_COEFF = .705

//DMX Colors
const COLOR_RED = 10
const COLOR_WHITE = 0
const COLOR_BLUE = 30

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
                startAngle: SPOTLIGHT_START_ANGLE,
                assignedTag: '842E1431C72A',
                channels: new DMXDevice(path)
            }
            console.log("Device Path @ " + spotlight.channels.port.path);
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
    return arcTan
}
function calculatePitchAngle(targetX, targetY, spotlightX, spotlightY) {
    var opposite = Math.abs(spotlightX - targetX)
    var adjacent = Math.abs(spotlightY - targetY)
    var hypotenuse = Math.sqrt(Math.pow(opposite, 2) + Math.pow(adjacent, 2))
    var arcTan = (Math.atan(hypotenuse / spotlight.height) * (180 / Math.PI))
    return arcTan
}
function calculateSpotlightMovement(targetX, targetY) {
    var yaw = 0
    var pitch = 0

    yaw = Math.floor(calculateYawAngle(targetX, targetY, spotlight.x, spotlight.y))
    pitch = Math.floor(calculatePitchAngle(targetX, targetY, spotlight.x, spotlight.y))

    //YAW: From Tangent to Clockface
    if (targetY <= spotlight.y && targetX > spotlight.x) {
        //console.log('│  Top right of screen')
        //do nothing!
    } else if (targetY > spotlight.y && targetX > spotlight.x) {
        //console.log('│  Bottom right of screen')
        yaw = (90 + (90 - yaw))
    } else if (targetY > spotlight.y && targetX <= spotlight.x) {
        //console.log('│  Bottom left of screen')
        yaw = 180 + yaw
    } else if (targetY <= spotlight.y && targetX <= spotlight.x) {
        //console.log('│  Top left of screen')
        yaw = (270 + (90 - yaw))
    }
    console.log('┌─────────  '  + targetX.toFixed(2) + "m " + targetY.toFixed(2) + "m. ─────────")
    console.log("│  Yaw: " + yaw) // + ", Pitch: " + pitch)
    yaw = (yaw - spotlight.startAngle);
    console.log("│  Yaw - Start Angle: " + yaw) // + ", Pitch: " + pitch)
    yaw = wrapIndex(yaw, 360)
    console.log("│  Yaw - Start Angle, Wrapped: " + yaw) // + ", Pitch: " + pitch)

    //PITCH, FLIPPED!:
    console.log("│  --- ")
    console.log("│  Pitch: " + pitch)
    pitch = 90 - pitch;
    console.log("│  90 minus Pitch: " + pitch)
    pitch = wrapIndex(pitch, 179)
    console.log("│  Pitch, Wrapped: " + pitch) // + ", Pitch: " + pitch)
    console.log('└─────────────────────────────────');

    //Rectify yaw's 360° and pitch's 180° to 255
    yaw = yaw / YAW_COEFF
    pitch = pitch / PITCH_COEFF

    return {yaw: yaw, pitch: pitch};
}
function wrapIndex(i, i_max) {
    return ((i % i_max) + i_max) % i_max;
 }

//#endregion

//#region [ rgba(000, 255, 255, 0.15) ] HTTP ROUTES!

app.route('/api/move/:id').post((req, res) => {
    try {
        let retObj = calculateSpotlightMovement(req.body.x, req.body.y)
        let yaw = retObj.yaw;
        let pitch = retObj.pitch;

        spotlight.channels.setChannels({
            1: yaw,
            2: 0,
            3: pitch,
            4: 0,
            5: 0, //gobo
            6: COLOR_WHITE,
            7: 0, //strobe
            8: 20, //req.body.lum
            9: 0
        }, true)
        res.status(200).send({ message: "Ok" })
    } catch (error) {
        res.status(500).send({ message: "Error. " + error })
    }
});
app.listen(port, () => {
    console.log(`Listening on port ${port}.`)
});

//#endregion

//#region [ rgba(255, 000, 255, 0.15) ] MQTT ROUTES!

mqttClient.on("connect", () => {
    console.log('mqtt connected \n')
})
mqttClient.on("error", () => {
    console.log('mqtt error')
})
mqttClient.subscribe([testTopic], { qos: 2 });
mqttClient.on('message', (topic, message, packet) => {
    try {
        var targetCoordinates = JSON.parse(message.toString())

        let retObj = calculateSpotlightMovement(targetCoordinates.x, targetCoordinates.y)
        let yaw = retObj.yaw;
        let pitch = retObj.pitch;

        spotlight.channels.setChannels({
            1: yaw,
            2: 0,
            3: pitch,
            4: 0,
            5: 0, //gobo
            6: COLOR_WHITE,
            7: 0, //strobe
            8: 20, //req.body.lum
            9: 0
        }, true)
        res.status(200).send({ message: "Ok" })
    } catch (error) {
        res.status(500).send({ message: "Error. Spotlight not initialized. " + error })
    }
})

//#endregion