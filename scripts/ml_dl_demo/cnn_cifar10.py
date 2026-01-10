'''
- 使用 CIFAR-10 数据集，这是一个包含 10 个类别（如飞机、汽车、猫、狗等）的图像数据集。

- 代码说明：
  - 加载数据集：
    - 使用 cifar10.load_data() 加载 CIFAR-10 数据集。
    - CIFAR-10 包含 60,000 张 32x32 的彩色图像，分为 10 个类别。
  - 数据预处理：
    - 将像素值归一化到 [0, 1] 范围。
    - 将标签转换为 one-hot 编码，以便用于分类任务。
  - 构建 CNN 模型：
    - 使用 Conv2D 添加卷积层，MaxPooling2D 添加池化层。
    - 使用 Flatten 将卷积层的输出展平为一维向量。
    - 添加全连接层（Dense）和 Dropout 层以防止过拟合。
    - 输出层使用 softmax 激活函数，输出 10 个类别的概率。
  - 编译模型：
    - 使用 adam 优化器。
    - 使用 categorical_crossentropy 作为损失函数，适用于多分类任务。
  - 训练模型：
    - 训练 20 个 epochs，批量大小为 64。
    - 使用 20% 的训练数据作为验证集。
  - 评估模型：
    - 在测试集上评估模型的准确率。
  - 可视化训练过程：
    - 绘制训练和验证的准确率和损失曲线，观察模型的收敛情况。
    
- 输出结果：
  - 测试准确率：模型在测试集上的准确率。
  - 训练过程可视化：通过准确率和损失曲线，可以直观地观察模型的训练效果。
  
- 注意事项：
  - 数据增强：为了提高模型的泛化能力，可以使用数据增强技术（如随机裁剪、翻转等）。
  - 超参数调整：根据训练结果调整学习率、批量大小、卷积层的数量和神经元数量等超参数。
  - 模型复杂度：如果模型过拟合，可以尝试增加 Dropout 层或使用正则化技术。
  - 硬件加速：使用 GPU 加速训练过程，尤其是在处理大型数据集时。
'''

import tensorflow as tf
from tensorflow.keras.datasets import cifar10
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout
from tensorflow.keras.utils import to_categorical
import matplotlib.pyplot as plt

# 1. 加载 CIFAR-10 数据集
(x_train, y_train), (x_test, y_test) = cifar10.load_data()

# 数据预处理
x_train = x_train.astype('float32') / 255.0
x_test = x_test.astype('float32') / 255.0

# 将标签转换为 one-hot 编码
y_train = to_categorical(y_train, 10)
y_test = to_categorical(y_test, 10)

# 2. 构建 CNN 模型
model = Sequential([
    # 第一层卷积
    Conv2D(32, (3, 3), activation='relu', input_shape=(32, 32, 3)),
    MaxPooling2D((2, 2)),
    # 第二层卷积
    Conv2D(64, (3, 3), activation='relu'),
    MaxPooling2D((2, 2)),
    # 第三层卷积
    Conv2D(128, (3, 3), activation='relu'),
    MaxPooling2D((2, 2)),
    # 展平层
    Flatten(),
    # 全连接层
    Dense(128, activation='relu'),
    Dropout(0.5),
    # 输出层
    Dense(10, activation='softmax')
])

# 3. 编译模型
model.compile(optimizer='adam',
              loss='categorical_crossentropy',
              metrics=['accuracy'])

# 4. 训练模型
history = model.fit(x_train, y_train, epochs=20, batch_size=64,
                    validation_split=0.2, verbose=1)

# 5. 评估模型
test_loss, test_acc = model.evaluate(x_test, y_test, verbose=0)
print(f'Test accuracy: {test_acc:.4f}')

# 6. 可视化训练过程
plt.figure(figsize=(12, 4))
plt.subplot(1, 2, 1)
plt.plot(history.history['accuracy'], label='Training Accuracy')
plt.plot(history.history['val_accuracy'], label='Validation Accuracy')
plt.title('Accuracy over epochs')
plt.xlabel('Epochs')
plt.ylabel('Accuracy')
plt.legend()

plt.subplot(1, 2, 2)
plt.plot(history.history['loss'], label='Training Loss')
plt.plot(history.history['val_loss'], label='Validation Loss')
plt.title('Loss over epochs')
plt.xlabel('Epochs')
plt.ylabel('Loss')
plt.legend()

plt.show()
