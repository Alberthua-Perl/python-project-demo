import tensorflow as tf

# 加载模型
model = tf.keras.models.load_model('mnist_cnn.keras')

# 保存模型
model.save('mnist_cnn_savemodel', save_format='tf')
## 将 keras 格式的模型转换成 savemodel 格式