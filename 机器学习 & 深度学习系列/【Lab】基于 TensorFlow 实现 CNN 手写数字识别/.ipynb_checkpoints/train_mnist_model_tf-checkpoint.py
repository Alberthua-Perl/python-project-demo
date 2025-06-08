import tensorflow as tf
from tensorflow.keras import layers, models
import numpy as np
import matplotlib.pyplot as plt
 
# 加载 MNIST 数据集
(x_train, y_train), (x_test, y_test) = tf.keras.datasets.mnist.load_data()
 
# 数据预处理
x_train = x_train.reshape((-1, 28, 28, 1)).astype('float32') / 255.0
x_test = x_test.reshape((-1, 28, 28, 1)).astype('float32') / 255.0
 
# 构建 CNN 模型
model = models.Sequential([
    layers.Conv2D(32, (3,3), activation='relu', input_shape=(28, 28, 1)),
    layers.MaxPooling2D((2,2)),
    layers.Conv2D(64, (3,3), activation='relu'),
    layers.MaxPooling2D((2,2)),
    layers.Flatten(),
    layers.Dense(128, activation='relu'),
    layers.Dense(10, activation='softmax')
])

# 显示模型结构
model.summary()
 
# 编译模型
model.compile(optimizer='adam',
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])
 
# 训练模型
history = model.fit(x_train, y_train, 
                    epochs=5, batch_size=64, 
                    validation_data=(x_test, y_test))
 
# 评估模型
test_loss, test_acc = model.evaluate(x_test, y_test, verbose=0)
print(f'Accuracy on test set: {test_acc * 100:.2f}%')

#model.save('mnist_cnn.h5')
model.save('mnist_cnn.keras')
 
# 进行预测并可视化
predictions = model.predict(x_test[:100])
predicted_labels = np.argmax(predictions, axis=1)
 
# 显示预测结果
fig, axes = plt.subplots(2, 5, figsize=(10, 6))
axes = axes.flatten()
for img, true_label, pred_label, ax in zip(x_test[:10], y_test[:10], predicted_labels[:10], axes):
    ax.imshow(img.squeeze(), cmap='gray')
    ax.set_title(f'True: {true_label}, Pred: {pred_label}')
    ax.axis('off')
 
plt.tight_layout()
plt.show()
