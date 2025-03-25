# Hand Drawing with MediaPipe and Flask

This project demonstrates a real-time hand drawing application using MediaPipe for hand tracking, Flask for the backend, and JavaScript for the frontend. It allows users to draw on a canvas with hand gestures, select different shapes, and customize drawing parameters.

## Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Directory Structure](#directory-structure)
- [Gesture Recognition](#gesture-recognition)
- [Customization](#customization)
- [Performance Considerations](#performance-considerations)
- [Error Handling](#error-handling)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Real-time Hand Tracking:** Uses MediaPipe to detect and track hand landmarks from a webcam feed.
- **Pinch Gesture Drawing:** Allows users to draw on the canvas by performing a pinch gesture with their thumb and index finger.
- **Shape Selection:** Provides a selection of predefined shapes to draw (e.g., lines, rectangles, circles, triangles, squares, pentagons, hexagons, octagons, nonagons, left arrow, bidirectional arrows etc.).
- **Gesture-Based Shape Switching:** Switches between shapes using a "Victory" sign gesture (index and middle fingers extended).
- **Color and Line Width Customization:** Allows users to adjust the drawing color and line width.
- **Clear Canvas Functionality:** Provides a button to clear the canvas.
- **Save Image Functionality:** Allows users to save the canvas content as a PNG image.
- **Advanced Visual Design:** Features a modern, dark theme with gradients, shadows, and animated hover effects.
- **Drawing Delay:** Introduces a delay after completing a shape to prevent accidental subsequent drawings.

## Demo

A live demo of the application may be available at [replace with actual link if deployed]. Note that webcam access is required.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python:** (3.6 or higher) - [https://www.python.org/downloads/](https://www.python.org/downloads/)
- **pip:** (Python package installer) - Generally included with Python installations.
- **Flask:** (Python web framework)
- **OpenCV:** (Python library for image processing)
- **MediaPipe:** (Python library for AI perception)
- **Flask-CORS:** (Python library for handling Cross-Origin Resource Sharing)
- **Node.js** and **npm:** (If you plan on using npm to manage the MediaPipe JavaScript dependencies)

## Installation

1.  **Clone the repository:**

    ```bash
    git clone [repository URL]
    cd [repository directory]
    ```

2.  **Create a virtual environment (recommended):**

    ```bash
    python -m venv venv
    ```

3.  **Activate the virtual environment:**

    - On Windows:

      ```bash
      venv\Scripts\activate
      ```

    - On macOS and Linux:

      ```bash
      source venv/bin/activate
      ```

4.  **Install the required Python packages:**

    ```bash
    pip install flask opencv-python mediapipe flask-cors
    ```

    This will install Flask, OpenCV, MediaPipe, and Flask-CORS.

5.  **Install MediaPipe JavaScript dependencies:**

    MediaPipe JavaScript files are included in the project so no steps needed. However, if you want to upgrade MediaPipe version, you can install using npm:

    ```bash
    npm install @mediapipe/drawing_utils @mediapipe/hands filesaver --save
    ```

    (This step assumes you have Node.js and npm installed.)

## Usage

1.  **Run the Flask application:**

    ```bash
    python app.py
    ```

    This will start the Flask development server.

2.  **Open the application in your web browser:**

    Navigate to `http://127.0.0.1:5000/` (or the address shown in your terminal when Flask starts) in your web browser.

3.  **Grant Webcam Access:**

    Your browser will prompt you for permission to access your webcam. Grant the necessary permissions.

4.  **Start Drawing:**

    - Position your hand in front of the camera.
    - Make a pinch gesture (thumb and index finger touching) to start drawing.
    - Move your hand to draw on the canvas.
    - Release the pinch gesture to stop drawing.
    - Form a Victory sign to switch the shapes.

5.  **Use the Controls:**

    - Click the "Clear Canvas" button to erase the canvas.
    - Use the color picker to change the drawing color.
    - Adjust the line width using the input field.
    - Click the "Save Image" button to download the canvas as a PNG file.

## Directory Structure

hand-drawing-project/
├── app.py # Flask backend application
├── templates/ # HTML templates
│ └── index.html # Main HTML file
├── static/ # Static assets (CSS, JavaScript, images)
│ ├── style.css # CSS stylesheet
│ ├── script.js # JavaScript file
│ └── images/ # Shape images
│ ├── arrow_bidirectional.png
│ ├── arrow_left.png
│ ├── circle.png
│ ├── hexagon.png
│ ├── line.png
│ ├── nonagon.png
│ ├── octagon.png
│ ├── pentagon.png
│ ├── rectangle.png
│ └── square.png
├── README.md # This file
└── venv/ # Virtual environment (optional)

## Gesture Recognition

- **Pinch Gesture:** Detected by calculating the distance between the thumb and index finger tips. Drawing starts when the distance is below a `pinchStartThreshold` and stops when the distance exceeds a `pinchEndThreshold`. A hysteresis is used to make the pinch detection more stable.

- **Victory Gesture:** Switches between different shapes using the "Victory" sign gesture, that is when middle finger and pointing finger is pointing upward, others folded, to switch between the shapes

## Customization

- **Thresholds:** You can adjust the gesture sensitivity by modifying the following variables in `script.js`:
  - `pinchThreshold`: Base pinch threshold.
  - `pinchStartThreshold`: Threshold for starting to draw.
  - `pinchEndThreshold`: Threshold for stopping drawing.
- **Drawing Parameters:** Modify the `colorPicker.value` and `lineWidthInput.value` to change the drawing color and line width, respectively.

- **Shape Images:** Replace the images in the `static/images/` directory to customize the shape selection window. Ensure the filenames match the `data-shape` attributes in `index.html`.

## Performance Considerations

- **MediaPipe Overhead:** MediaPipe can be resource-intensive. If you experience performance issues (e.g., low frame rate), try reducing the `modelComplexity` or increasing the `minDetectionConfidence` and `minTrackingConfidence` in the `hands.setOptions()` call within `script.js`.

## Error Handling

The code includes basic error handling for webcam access. For a production environment, consider adding more robust error handling, especially for MediaPipe initialization and network requests.

## Future Enhancements

- **More Gestures:** Add support for more hand gestures to control different application features.
- **Shape Size Control:** Allow users to control the size of shapes being drawn.
- **Undo/Redo Functionality:** Implement undo and redo functionality.
- **Improved UI:** Enhance the user interface with more interactive elements and customization options.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your changes. Follow these guidelines:

- Use clear and concise commit messages.
- Document your code thoroughly.
- Test your changes before submitting.

## License
