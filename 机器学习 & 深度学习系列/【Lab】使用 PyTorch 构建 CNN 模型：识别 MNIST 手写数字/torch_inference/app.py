import torch
import torch.nn as nn
import numpy as np
from flask import Flask, request, jsonify, render_template
import base64, io
from PIL import Image

app = Flask(__name__)

# ===== 1. 网络定义必须和训练时完全一致 =====
class CNN_demo(nn.Module):
    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(1, 16, 3, 1, 1),    # 1×28×28 -> 16×28×28
            nn.MaxPool2d(2),              # 16×14×14
            nn.Conv2d(16, 32, 3, 1, 1),   # 32×14×14
            nn.MaxPool2d(2),              # 32×7×7
            nn.Flatten(),                 # 1568
            nn.Linear(32*7*7, 16),
            nn.ReLU(),
            nn.Linear(16, 10)
        )
    def forward(self, x):
        return self.net(x)

# ===== 2. 加载模型 =====
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = CNN_demo().to(device)
model.load_state_dict(torch.load("mnist_cnn_pytorch.pth", map_location=device))
model.eval()  # 推理模式

# ===== 3. 预处理（与 TF 版完全一致） =====
def preprocess_image(image_data):
    try:
        image = Image.open(io.BytesIO(image_data))
        image = image.resize((28, 28)).convert('L')
        image = np.array(image, dtype=np.float32) / 255.0
        image = image.reshape((1, 28, 28, 1))      # 先保持 NHWC
        image = np.transpose(image, (0, 3, 1, 2))  # NHWC -> NCHW，PyTorch 需要
        return torch.tensor(image, device=device)
    except Exception as e:
        raise ValueError(f"Invalid image data: {e}")

# ===== 4. 推理 =====
def predict(image_data):
    x = preprocess_image(image_data)
    with torch.no_grad():
        logits = model(x)
        pred = logits.argmax(1).item()
    return pred

# ===== 5. 路由（完全复用原来代码） =====
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict_digit():
    if request.method == 'POST':
        data = request.json
        if 'image' not in data:
            return jsonify({'error': 'No image data'}), 400
        image_b64 = data['image'].split(',')[1]
        image_data = base64.b64decode(image_b64)
        try:
            return jsonify({'prediction': int(predict(image_data))})
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

# ===== 6. 启动 =====
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
