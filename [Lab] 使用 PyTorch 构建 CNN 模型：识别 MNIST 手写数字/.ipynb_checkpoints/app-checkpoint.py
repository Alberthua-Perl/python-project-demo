import tensorflow as tf
import numpy as np
from flask import Flask, request, jsonify, render_template
import base64
import io
from PIL import Image

app = Flask(__name__)

# 加载模型
#model = tf.keras.models.load_model('mnist_cnn_savemodel')
model = tf.keras.models.load_model('mnist_cnn.keras')

# 定义预处理函数
def preprocess_image(image_data):
    try:
        image = Image.open(io.BytesIO(image_data))
        image = image.resize((28, 28)).convert('L')
        image = np.array(image, dtype=np.float32) / 255.0
        image = image.reshape((1, 28, 28, 1))
        return image
    except Exception as e:
        raise ValueError(f"Invalid image data: {e}")

# 定义推理函数
def predict(image_data):
    image = preprocess_image(image_data)
    prediction = model.predict(image)
    predicted_label = np.argmax(prediction, axis=1)[0]
    return predicted_label

@app.route('/')
def index():
    return render_template('index.html')  # 读取 templates 目录中的 index.html 文件

@app.route('/predict', methods=['POST'])
def predict_digit():
    if request.method == 'POST':
        data = request.json
        if 'image' not in data:
            return jsonify({'error': 'No image data'}), 400
        image_data = data['image'].split(',')[1]  # 去掉 Data URL 的前缀
        image_data = base64.b64decode(image_data)
        try:
            prediction = predict(image_data)
            return jsonify({'prediction': int(prediction)})
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

# 启动 Flask 服务器
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)  # 服务监听本地所有地址与回环地址