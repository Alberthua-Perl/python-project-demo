import torch
import torch.nn as nn
import torchvision
import torchvision.transforms as transforms
import matplotlib.pyplot as plt

# 训练数据集
train_data = torchvision.datasets.MNIST(
    root="data",    # 表示把 MINST 保存在 data 文件夹下
    download=True,  # 表示需要从网络上下载。下载过一次后，下一次就不会再重复下载了
    train=True,     # 表示这是训练数据集
    transform=transforms.ToTensor()
                    # 要把数据集中的数据转换为 pytorch 能够使用的 Tensor 类型
)

# 测试数据集
test_data = torchvision.datasets.MNIST(
    root="data",    # 表示把 MINST 保存在 data 文件夹下
    download=True,  # 表示需要从网络上下载。下载过一次后，下一次就不会再重复下载了
    train=False,    # 表示这是测试数据集
    transform=transforms.ToTensor()
                    # 要把数据集中的数据转换为 pytorch 能够使用的 Tensor 类型
)

# 创建 DataLoader
train_dataloader = torch.utils.data.DataLoader(train_data, batch_size=64, shuffle=True)
test_dataloader = torch.utils.data.DataLoader(test_data, batch_size=1000, shuffle=False)

# 定义卷积神经网络类
class GLS_CNN(nn.Module):
    def __init__(self):
        super(GLS_CNN, self).__init__()
        self.net = nn.Sequential(
            nn.Conv2d(in_channels=1, out_channels=16,   # 输入、输出通道数，输出通道数可以理解为提取了几种特征
                      kernel_size=(3, 3),               # 卷积核尺寸 
                      stride=(1, 1),                    # 卷积核每次移动多少个像素 
                      padding=1),                       # 原图片边缘加几个空白像素
                                                        # 输入图片尺寸为 1×28×28
                                                        # 第一次卷积，尺寸为 16×28×28
            nn.MaxPool2d(kernel_size=2),                # 第一次池化，尺寸为 16×14×14
            nn.Conv2d(16, 32, 3, 1, 1),                 # 第二次卷积，尺寸为 32×14×14
            nn.MaxPool2d(2),                            # 第二次池化，尺寸为 32×7×7
            nn.Flatten(),                               # 将三维数组变成一维数组
            nn.Linear(32*7*7, 16),                      # 变成 16 个卷积核，每一个卷积核是 1*1，最后输出 16 个数字
            nn.ReLU(),                                  # 激活函数 x<0 y=0  x>0 y=x，用在反向传导
            nn.Linear(16, 10)                           # 将 16 变成 10，预测 0-9 之间概率值
        )

    def forward(self, x):
        return self.net(x)

# 初始化模型
model = GLS_CNN()

# 交叉熵损失函数，选择一种方法计算误差值
loss_func = torch.nn.CrossEntropyLoss()

# 优化器，随机梯度下降算法
optimizer = torch.optim.SGD(model.parameters(), lr=0.2)

# 定义训练次数
num_epochs = 5  # 训练5个循环

# 用于存储训练和验证过程中的损失和准确率
train_losses = []
val_losses = []
train_accuracies = []
val_accuracies = []

# 循环训练
for epoch in range(num_epochs):
    # 把训练集中的数据训练一遍
    model.train()
    running_loss = 0.0
    correct = 0

    for imgs, labels in train_dataloader:
        optimizer.zero_grad()
        outputs = model(imgs)              # 输出 0~9 预测的结果概率
        loss = loss_func(outputs, labels)  # 和输入做一个比较，得到一个误差
        #optimizer.zero_grad()             # 初始化梯度，清空梯度。注意清空优化器的梯度，防止累计
        loss.backward()                    # 反向传播计算
        optimizer.step()                   # 累加 1，执行一次
        running_loss += loss.item()
        correct += (outputs.argmax(1) == labels).sum().item()

    train_losses.append(running_loss / len(train_dataloader))
    train_accuracies.append(correct / len(train_dataloader.dataset))

    model.eval()
    with torch.no_grad():
        running_loss = 0.0
        correct = 0

        for imgs, labels in test_dataloader:
            outputs = model(imgs)
            loss = loss_func(outputs, labels)
            running_loss += loss.item()
            correct += (outputs.argmax(1) == labels).sum().item()

    val_losses.append(running_loss / len(test_dataloader))
    val_accuracies.append(correct / len(test_dataloader.dataset))

# 保存训练的结果（包括模型和参数）
torch.save(model.state_dict(), "mnist_cnn_pytorch.pth")  # 保存模型权重

# 保存模型为HDF5格式
torch.save(model, "mnist_cnn_pytorch.h5")

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
