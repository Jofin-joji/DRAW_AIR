from flask import Flask, render_template, request, jsonify
import cv2
import numpy as np
import mediapipe as mp
from flask_cors import CORS

app = Flask(__name__)  # Use __name__ instead of name
app.static_folder = 'static'
app.template_folder = 'templates'

CORS(app)

mp_drawing = mp.solutions.drawing_utils
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=False,
max_num_hands=1,
min_detection_confidence=0.7,
min_tracking_confidence=0.7)

def detect_pinch(landmarks):
    """Detects a pinch gesture based on the distance between thumb and index finger tips."""
    thumb_tip = landmarks.landmark[4]
    index_tip = landmarks.landmark[8]
    distance = np.sqrt((index_tip.x - thumb_tip.x)**2 + (index_tip.y - thumb_tip.y)**2)
    pinch_threshold = 0.05  # Adjust this
    return distance < pinch_threshold

@app.route('/process_frame', methods=['POST'])
def process_frame():
    data = request.get_json()
    frame_data = data['frame']
    shape = data['shape']  #Shape information is not necessary from the server, can be done in the client side
    isDrawing = data["isDrawing"]
    start_x = data["startX"]
    start_y = data["startY"]
    color = data["color"]
    lineWidth = data["lineWidth"]

    frame_bytes = bytes(int(x) for x in frame_data.split(','))
    frame_np = np.frombuffer(frame_bytes, dtype=np.uint8).reshape((600, 800, 3))
    rgb_frame = cv2.cvtColor(frame_np, cv2.COLOR_BGR2RGB)

    results = hands.process(rgb_frame)
    hand_landmarks = None

    landmark_list = []  # Initialize an empty list to store the landmark coordinates

    if results.multi_hand_landmarks:
        hand_landmarks = results.multi_hand_landmarks[0]

        # Extract landmark coordinates and store them in the list
        for landmark in hand_landmarks.landmark:
            landmark_list.append([landmark.x, landmark.y, landmark.z])
        landmarks = hand_landmarks.landmark
        indexFingerX = int(landmarks[8].x * 800)
        indexFingerY = int(landmarks[8].y * 600)
        pinch_detected = detect_pinch(hand_landmarks)

        if pinch_detected and not isDrawing:
            isDrawing = True
            start_x, start_y = indexFingerX, indexFingerY
        elif not pinch_detected and isDrawing:
            isDrawing = False
            cv2.line(frame_np, (start_x, start_y), (indexFingerX, indexFingerY), (0, 0, 0), 3)
        cv2.circle(frame_np, (indexFingerX, indexFingerY), 5, (0, 0, 255), -1)

    # Convert frame_np back to a comma-separated string for sending to the frontend
    frame_data = ','.join([str(x) for x in frame_np.flatten().tolist()])

    return jsonify({'hand_landmarks': landmark_list, 'frame': frame_data, "isDrawing": isDrawing, "startX": start_x, "startY": start_y})

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)