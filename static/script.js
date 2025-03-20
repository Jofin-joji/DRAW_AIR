const videoElement = document.getElementById('videoElement');
const canvasElement = document.getElementById('drawingCanvas');
const canvasCtx = canvasElement.getContext('2d');
const clearButton = document.getElementById('clearButton');
const colorPicker = document.getElementById('colorPicker');
const lineWidthInput = document.getElementById('lineWidth');
const shapeSelector = document.getElementById('shapeSelector');
const saveButton = document.getElementById('saveButton');

let isDrawing = false;
let startX = 0;
let startY = 0;
let currentShape = 'line';
let currentEndX = 0;
let currentEndY = 0;
let persistentShapes = []; // Store completed shapes

const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.8,
    minTrackingConfidence: 0.8
});

hands.onResults(onResults);

async function getCameraFeed() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        videoElement.srcObject = stream;
        videoElement.onloadedmetadata = () => {
            videoElement.play();
        };
    } catch (error) {
        console.error("Error accessing webcam:", error);
    }
}

function detectPinch(landmarks) {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];

    const distance = Math.sqrt(
        Math.pow(indexTip.x - thumbTip.x, 2) + Math.pow(indexTip.y - thumbTip.y, 2)
    );

    const pinchThreshold = 0.08; // Adjust

    return distance < pinchThreshold;
}

function clearCanvas() {
    persistentShapes = [];
    redrawCanvas();
}

function saveImage() {
    const dataURL = canvasElement.toDataURL("image/png");
    const filename = "hand_drawing.png";

    // Use FileSaver.js to trigger the download
    saveAs(dataURL, filename);
}

//Draw a point on the given cordinates
function drawPoint(x, y, color, size) {
    canvasCtx.beginPath();
    canvasCtx.arc(x, y, size, 0, 2 * Math.PI);
    canvasCtx.fillStyle = color;
    canvasCtx.fill();
}

//Draw shape preview
function drawShape(startX, startY, endX, endY, shape) {
    canvasCtx.beginPath();
    canvasCtx.strokeStyle = colorPicker.value;
    canvasCtx.lineWidth = lineWidthInput.value;

    switch (shape) {
        case 'line':
            canvasCtx.moveTo(startX, startY);
            canvasCtx.lineTo(endX, endY);
            break;
        case 'rectangle':
            canvasCtx.rect(startX, startY, endX - startX, endY - startY);
            break;
        case 'circle':
            const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            canvasCtx.arc(startX, startY, radius, 0, 2 * Math.PI);
            break;
        case 'triangle':
            canvasCtx.moveTo(startX, startY);
            canvasCtx.lineTo(endX, endY);
            canvasCtx.lineTo(startX * 2 - endX, endY);
            canvasCtx.closePath();
            break;
        case 'square':
            const side = Math.max(Math.abs(endX - startX), Math.abs(endY - startY));
            canvasCtx.rect(startX, startY, (endX>startX)? side : -side, (endY>startY)? side : -side);
            break;
    }

    canvasCtx.stroke();
}

//Redraw all existing and persistant shapes
function redrawCanvas() {
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Redraw persistent shapes
    persistentShapes.forEach(shapeData => {
        drawShape(shapeData.startX, shapeData.startY, shapeData.endX, shapeData.endY, shapeData.shape);
    });
}

function onResults(results) {
    //Clear the canvas before draw new shapes
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    redrawCanvas(); // Re-draw all persistent shapes

    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            //Draw Landmarks on the camera view
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS,
                           {color: '#00FF00', lineWidth: 2});
            drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 1});

            const indexFingerX = landmarks[8].x * canvasElement.width;
            const indexFingerY = landmarks[8].y * canvasElement.height;

            currentEndX = indexFingerX;
            currentEndY = indexFingerY;

            const pinchDetected = detectPinch(landmarks);

            if (pinchDetected && !isDrawing) {
                isDrawing = true;
                startX = indexFingerX;
                startY = indexFingerY;
                currentShape = shapeSelector.value;
            } else if (!pinchDetected && isDrawing) {
                isDrawing = false;
                // When drawing ends, store the completed shape
                drawShape(startX, startY, currentEndX, currentEndY, currentShape);
                persistentShapes.push({
                    startX: startX,
                    startY: startY,
                    endX: currentEndX,
                    endY: currentEndY,
                    shape: currentShape
                });
                redrawCanvas(); // Show and persist draw shape
            } else if (isDrawing) {

                drawShape(startX, startY, currentEndX, currentEndY, currentShape); //Draw current coordination
            }
            drawPoint(indexFingerX, indexFingerY, colorPicker.value, lineWidthInput.value);
        }
    }
}

clearButton.addEventListener('click', clearCanvas);
saveButton.addEventListener('click', saveImage);

getCameraFeed();

videoElement.addEventListener('loadeddata', async () => {
    const width = videoElement.videoWidth;
    const height = videoElement.videoHeight;
    canvasElement.width = 1000;
    canvasElement.height = 700;

    await hands.send({ image: videoElement });

    async function frameLoop() {
        await hands.send({ image: videoElement });
        requestAnimationFrame(frameLoop);
    }

    frameLoop();
});