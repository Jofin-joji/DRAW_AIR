const videoElement = document.getElementById('videoElement');
const canvasElement = document.getElementById('drawingCanvas');
const canvasCtx = canvasElement.getContext('2d');
const clearButton = document.getElementById('clearButton');
const colorPicker = document.getElementById('colorPicker');
const lineWidthInput = document.getElementById('lineWidth');
const saveButton = document.getElementById('saveButton');

const shapeImages = document.querySelectorAll('.shape-image');
let currentShapeIndex = 0;
let currentShape = shapeImages[currentShapeIndex].dataset.shape;
let isDrawing = false;
let startX = 0;
let startY = 0;
let currentEndX = 0;
let currentEndY = 0;
let persistentShapes = [];

// Pinch Gesture Variables
const pinchThreshold = 0.09; // Original Threshold
const pinchStartThreshold = pinchThreshold + 0.01; // Higher value to start drawing
const pinchEndThreshold = pinchThreshold + 0.01;   // Increased to be same as start
const minDrawDistance = 10; // Minimum distance to consider a shape drawn

let victoryGestureStartTime = null; // When the victory gesture started
const victoryGestureHoldTime = 1000; // 2 seconds (milliseconds)
let isVictoryGestureActive = false;

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
    return distance;
}

function detectVictoryGesture(landmarks) {
    const indexFingerTip = landmarks[8];
    const middleFingerTip = landmarks[12];
    const ringFingerTip = landmarks[16];
    const pinkyFingerTip = landmarks[20];
    const thumbTip = landmarks[4];

    // Check if index and middle fingers are extended (high y value)
    const indexFingerExtended = indexFingerTip.y < ringFingerTip.y;
    const middleFingerExtended = middleFingerTip.y < ringFingerTip.y;

    // Check if ring and pinky fingers are curled (low y value)
    const ringFingerCurled = ringFingerTip.y > middleFingerTip.y;
    const pinkyFingerCurled = pinkyFingerTip.y > middleFingerTip.y;

    // Check if thumb is not obstructing the view of other fingers
    const thumbPositionValid = thumbTip.x < indexFingerTip.x;
    return indexFingerExtended && middleFingerExtended && ringFingerCurled && pinkyFingerCurled && thumbPositionValid;
}

function clearCanvas() {
    persistentShapes = [];
    redrawCanvas();
}

function saveImage() {
    const dataURL = canvasElement.toDataURL("image/png");
    const filename = "hand_drawing.png";
    saveAs(dataURL, filename);
}

function drawPoint(x, y, color, size) {
    canvasCtx.beginPath();
    canvasCtx.arc(x, y, size, 0, 2 * Math.PI);
    canvasCtx.fillStyle = color;
    canvasCtx.fill();
}

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
            canvasCtx.rect(startX, startY, (endX > startX) ? side : -side, (endY > startY) ? side : -side);
            break;
        case 'pentagon':
            drawPolygon(startX, startY, endX, endY, 5);
            break;
        case 'hexagon':
            drawPolygon(startX, startY, endX, endY, 6);
            break;
        case 'octagon':
            drawPolygon(startX, startY, endX, endY, 8);
            break;
        case 'nonagon':
            drawPolygon(startX, startY, endX, endY, 9);
            break;
        case 'arrow_left':
            drawArrow(startX, startY, endX, endY, 'left');
            break;

          case 'arrow_bidirectional':
               drawBidirectionalArrow(startX, startY, endX, endY);
               break;


    }

    canvasCtx.stroke();
}

function drawPolygon(startX, startY, endX, endY, sides) {
    const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    canvasCtx.moveTo(startX + radius * Math.cos(0), startY + radius * Math.sin(0));

    for (let i = 1; i <= sides; i++) {
        canvasCtx.lineTo(startX + radius * Math.cos(i * 2 * Math.PI / sides),
            startY + radius * Math.sin(i * 2 * Math.PI / sides));
    }
}

function drawArrow(startX, startY, endX, endY, direction) {
    const headLength = 20; // Length of the arrow head
    const angle = Math.atan2(endY - startY, endX - startX);

    switch (direction) {
        case 'up':
            drawArrowHead(endX, endY, angle - Math.PI / 2, headLength);
            canvasCtx.moveTo(startX, startY);
            canvasCtx.lineTo(endX, endY);
            break;
        case 'down':
            drawArrowHead(startX, startY, angle + Math.PI / 2, headLength);
            canvasCtx.moveTo(endX, endY);
            canvasCtx.lineTo(startX, startY);
            break;
        case 'left':
            drawArrowHead(startX, startY, angle + Math.PI, headLength);
            canvasCtx.moveTo(endX, endY);
            canvasCtx.lineTo(startX, startY);
            break;
        case 'right':
            drawArrowHead(endX, endY, angle, headLength);
            canvasCtx.moveTo(startX, startY);
            canvasCtx.lineTo(endX, endY);
            break;
    }
}
function drawBidirectionalArrow(startX, startY, endX, endY) {
    const headLength = 20; // Length of the arrow head
    const angle = Math.atan2(endY - startY, endX - startX);

    // Draw arrow head at the starting point
    drawArrowHead(startX, startY, angle + Math.PI, headLength);

    // Draw arrow head at the ending point
    drawArrowHead(endX, endY, angle, headLength);

    // Draw line connecting the two points
    canvasCtx.moveTo(startX, startY);
    canvasCtx.lineTo(endX, endY);
}

function drawArrowHead(x, y, angle, headLength) {
    canvasCtx.save();
    canvasCtx.translate(x, y);
    canvasCtx.rotate(angle);

    canvasCtx.moveTo(0, 0);
    canvasCtx.lineTo(-headLength, -headLength / 2);
    canvasCtx.lineTo(-headLength, headLength / 2);
    canvasCtx.closePath();

    canvasCtx.restore();
    canvasCtx.fill();
}
function redrawCanvas() {
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    persistentShapes.forEach(shapeData => {
        drawShape(shapeData.startX, shapeData.startY, shapeData.endX, shapeData.endY, shapeData.shape);
    });
}

function selectShape(index) {
    // De-select the previously selected shape
    shapeImages.forEach(img => img.classList.remove('selected'));
    // Add 'selected' class to the newly selected shape
    shapeImages[index].classList.add('selected');

    // Update the current shape
    currentShape = shapeImages[index].dataset.shape;
    currentShapeIndex = index;

    // Trigger the selection animation on the selected shape
    shapeImages[index].classList.add('selecting');
    setTimeout(() => {
        shapeImages[index].classList.remove('selecting');
    }, 500); // Remove the class after the animation duration (0.5s)
}

function onResults(results) {
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    redrawCanvas();

    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
            drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 1 });

            const indexFingerX = landmarks[8].x * canvasElement.width;
            const indexFingerY = landmarks[8].y * canvasElement.height;

            currentEndX = indexFingerX;
            currentEndY = indexFingerY;

            const pinchDistance = detectPinch(landmarks);

            const victoryGestureDetected = detectVictoryGesture(landmarks);

            if (victoryGestureDetected) {
                if (!isVictoryGestureActive) {
                    // Gesture just started
                    isVictoryGestureActive = true;
                    victoryGestureStartTime = Date.now();
                } else {
                    // Gesture is being held
                    const elapsedTime = Date.now() - victoryGestureStartTime;
                    if (elapsedTime >= victoryGestureHoldTime) {
                        // Held long enough, switch shape
                        currentShapeIndex = (currentShapeIndex + 1) % shapeImages.length;
                        selectShape(currentShapeIndex);
                        victoryGestureStartTime = null; // Reset timer
                        isVictoryGestureActive = false;
                    }
                }
            } else {
                // Gesture is not active
                isVictoryGestureActive = false;
                victoryGestureStartTime = null;
            }

            //Pinch Start and End detection
            if (pinchDistance < pinchStartThreshold && !isDrawing) {
                isDrawing = true;
                startX = indexFingerX;
                startY = indexFingerY;
            } else if (pinchDistance > pinchEndThreshold && isDrawing) {

                // Calculate the drawing distance
                const drawDistance = Math.sqrt(Math.pow(currentEndX - startX, 2) + Math.pow(currentEndY - startY, 2));
                if(drawDistance > minDrawDistance) {
                    isDrawing = false;
                    drawShape(startX, startY, currentEndX, currentEndY, currentShape);
                    persistentShapes.push({
                        startX: startX,
                        startY: startY,
                        endX: currentEndX,
                        endY: currentEndY,
                        shape: currentShape
                    });
                    redrawCanvas();
                } else {
                    isDrawing = false; // Reset isDrawing, but don't save or draw a tiny shape
                }
            } else if (isDrawing) {
                drawShape(startX, startY, currentEndX, currentEndY, currentShape);
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
    canvasElement.width = 1200;
    canvasElement.height = 800;

    await hands.send({ image: videoElement });

    async function frameLoop() {
        await hands.send({ image: videoElement });
        requestAnimationFrame(frameLoop);
    }

    frameLoop();
});

// Initialize shape selection
selectShape(0);