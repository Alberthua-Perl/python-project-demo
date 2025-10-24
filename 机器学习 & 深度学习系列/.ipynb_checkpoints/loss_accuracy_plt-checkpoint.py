import matploblib as plt

train_losses = [0.25395141060302656, 0.07062802842631936, 0.05335927371655901, 0.0428016380544131, 0.03663736345050857]
train_accuracies = [0.9181666666666667, 0.97795, 0.9828833333333333, 0.9866, 0.9883666666666666]
val_losses = [0.09859151244163514, 0.051632676646113394, 0.046159176528453826, 0.04669016301631927, 0.046961661987006666]
val_accuracies = [0.9682, 0.9839, 0.9864, 0.9855, 0.9852]

# 绘制损失图
plt.figure(figsize=(12, 4))
plt.subplot(1, 2, 1)
plt.plot(train_losses, label='Train Loss')
plt.plot(val_losses, label='Validation Loss')
plt.title('Loss During Training')
plt.xlabel('Epochs')
plt.ylabel('Loss')
plt.legend()

# 绘制准确率图
plt.figure(figsize=(12, 4))
plt.subplot(1, 2, 2)
plt.plot(train_accuracies, label='Train Accuracy')
plt.plot(val_accuracies, label='Validation Accuracy')
plt.title('Accuracy During Training')
plt.xlabel('Epochs')
plt.ylabel('Accuracy')
plt.legend()

plt.show()