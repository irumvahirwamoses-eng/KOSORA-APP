from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import json
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = './uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def detect_paper_edges(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(gray, 75, 200)

    contours, _ = cv2.findContours(edges.copy(), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:5]

    for contour in contours:
        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.02 * peri, True)

        if len(approx) == 4:
            return approx

    return None

def four_point_transform(image, pts):
    pts = pts.reshape(4, 2)
    rect = np.zeros((4, 2), dtype="float32")

    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]

    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]

    (tl, tr, br, bl) = rect
    widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
    widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
    maxWidth = max(int(widthA), int(widthB))

    heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
    heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
    maxHeight = max(int(heightA), int(heightB))

    dst = np.array([
        [0, 0],
        [maxWidth - 1, 0],
        [maxWidth - 1, maxHeight - 1],
        [0, maxHeight - 1]], dtype="float32")

    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))

    return warped

def detect_bubbles(warped_image, num_questions, bubble_labels=None):
    if bubble_labels is None:
        bubble_labels = ['A', 'B', 'C', 'D']

    gray = cv2.cvtColor(warped_image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2)

    height, width = thresh.shape

    bubble_region_width = int(width * 0.35)
    bubble_region_start_x = int(width * 0.05)
    bubble_region_start_y = int(height * 0.25)
    bubble_region_end_y = int(height * 0.9)

    roi = thresh[bubble_region_start_y:bubble_region_end_y, bubble_region_start_x:bubble_region_start_x + bubble_region_width]

    detected_answers = {}
    question_height = roi.shape[0] // num_questions if num_questions > 0 else 50
    bubble_width = roi.shape[1] // len(bubble_labels)

    for q in range(min(num_questions, roi.shape[0] // question_height)):
        y_start = q * question_height
        y_end = (q + 1) * question_height
        question_row = roi[y_start:y_end, :]

        bubble_densities = []
        for b in range(len(bubble_labels)):
            x_start = b * bubble_width
            x_end = (b + 1) * bubble_width
            bubble_roi = question_row[:, x_start:x_end]

            total_pixels = bubble_roi.shape[0] * bubble_roi.shape[1]
            if total_pixels == 0:
                bubble_densities.append(0)
                continue

            filled_pixels = np.sum(bubble_roi == 0)
            density = filled_pixels / total_pixels
            bubble_densities.append(density)

        if max(bubble_densities) > 0.15:
            selected_bubble = np.argmax(bubble_densities)
            detected_answers[q + 1] = bubble_labels[selected_bubble]

    return detected_answers

def process_omr_image(image_path, answer_key):
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError("Could not read image")

    original = image.copy()

    pts = detect_paper_edges(image)
    if pts is not None:
        warped = four_point_transform(image, pts)
    else:
        warped = image

    num_questions = len(answer_key)
    bubble_labels = ['A', 'B', 'C', 'D']

    detected_answers = detect_bubbles(warped, num_questions, bubble_labels)

    score = 0
    total = len(answer_key)

    for q_num, correct_answer in answer_key.items():
        q_num_int = int(q_num)
        if q_num_int in detected_answers:
            if detected_answers[q_num_int] == correct_answer:
                score += 1

    return {
        'detectedAnswers': detected_answers,
        'score': score,
        'totalMarks': total,
        'totalQuestions': total
    }

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'Kosora OMR Scanner'})

@app.route('/process-omr', methods=['POST'])
def process_omr():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400

        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Use PNG, JPG, or JPEG'}), 400

        answer_key_str = request.form.get('answer_key')
        if not answer_key_str:
            return jsonify({'error': 'answer_key is required'}), 400

        answer_key = json.loads(answer_key_str)

        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        result = process_omr_image(filepath, answer_key)

        try:
            os.remove(filepath)
        except:
            pass

        return jsonify(result)

    except json.JSONDecodeError:
        return jsonify({'error': 'Invalid answer_key format. Must be valid JSON'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/detect-paper', methods=['POST'])
def detect_paper():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400

        file = request.files['image']
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        image = cv2.imread(filepath)
        pts = detect_paper_edges(image)

        result = {
            'paper_detected': pts is not None,
            'corners': pts.tolist() if pts is not None else None
        }

        os.remove(filepath)
        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Kosora OMR Scanner Service starting on port 5001...")
    print("Make sure Tesseract-OCR is installed and in PATH")
    app.run(host='0.0.0.0', port=5001, debug=True)
