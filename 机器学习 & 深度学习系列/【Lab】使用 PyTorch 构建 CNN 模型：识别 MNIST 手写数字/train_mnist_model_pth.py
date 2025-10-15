import torch
import torch.nn as nn
import torchvision
import torchvision.transforms as transforms
from torchinfo import summary  # 获取模型结构与参数
import matplotlib.pyplot as plt
from tqdm import tqdm  # 显示训练进度条

# 使用 CUDA 加速训练
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print('Using device:', device)  #NVIDIA RTX 2000 Ada Generation Laptop GPU

# 训练数据集
train_data = torchvision.datasets.MNIST(
    root="data",    # 表示把 MNIST 保存在 data 文件夹下
    download=True,  # 表示需要从网络上下载。下载过一次后，下一次就不会再重复下载。
    train=True,     # 表示这是训练数据集
    transform=transforms.ToTensor()
                    # 要把数据集中的数据转换为 pytorch 能够使用的 Tensor 类型
)

# 测试数据集
test_data = torchvision.datasets.MNIST(
    root="data",    # 表示把 MNIST 保存在 data 文件夹下
    download=True,  # 表示需要从网络上下载。下载过一次后，下一次就不会再重复下载。
    train=False,    # 表示这是测试数据集
    transform=transforms.ToTensor()
                    # 要把数据集中的数据转换为 pytorch 能够使用的 Tensor 类型
)

# 创建 DataLoader
train_dataloader = torch.utils.data.DataLoader(train_data, batch_size=64, shuffle=True)
print("total_batch_num_of_each_epoch_in_train_dataset: ", len(train_dataloader))  # 938
print("num_of_samples_in_train_dataset: ", len(train_dataloader.dataset))  # 60000
test_dataloader = torch.utils.data.DataLoader(test_data, batch_size=1000, shuffle=False)
print("total_batch_num_of_each_epoch_in_test_dataset: ", len(test_dataloader))  # 10
print("num_of_samples_in_test_dataset: ", len(test_dataloader.dataset))  # 10000
# 说明：
#   1. MNIST 数据集中训练数据集 60000 张图片（28px X 28px），测试数据集 10000 张图片。
#   2. 训练数据集：batch_size=64（每批次取 64 张图片训练），每个 epoch 中共需要 60000/64 ≈ 938 个批次，共训练 5 个 epoch。
#   3. 测试数据集：batch_size=1000（每批次取 1000 张图片训练），每个 epoch 中共需要 10000/1000 = 10 个批次，共训练 5 个 epoch。
#   4. shuffle 参数：是否随机打乱顺序

# 定义卷积神经网络类
class CNN_demo(nn.Module):
    def __init__(self):
        super(CNN_demo, self).__init__()
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
            nn.Flatten(),                               # 把 32x7x7 的立体特征拉成 1 维向量（32×7×7=1568)，供全连接层使用。
            nn.Linear(32*7*7, 16),                      # 全连接（Dense）：1568 个特征 → 16 个隐藏单元（隐藏层），作用：组合不同局部特征，形成更抽象的全局表示。
            nn.ReLU(),                                  # 非线性激活函数 x<0，y=0；x>0，y=x，用于反向传播算法。
            nn.Linear(16, 10)                           # 最后一层分类器：16 个隐藏单元 → 10 个输出（对应 0-9 类别）
                                                        # 后续用 CrossEntropyLoss 会把这 10 个数当 logits，自动做 softmax 得到概率。
        )

    def forward(self, x):
        return self.net(x)
# 模型总结：卷积 → 池化降尺寸 → 拉平 → 全连接压缩 → ReLU 非线性 → 全连接分类：把空间特征逐步抽象成 10 个类别分数

# 初始化模型
model = CNN_demo().to(device)  # 使用 CUDA 加速训练

# 模型结构与参数汇总
summary(model, input_size=(1, 1, 28, 28))

# 交叉熵损失函数，选择一种方法计算误差值
loss_func = torch.nn.CrossEntropyLoss()

# 优化器，随机梯度下降算法
optimizer = torch.optim.SGD(model.parameters(), lr=0.2)

# 定义训练次数
num_epochs = 5  # 训练5个循环

# 用于存储训练和验证过程中的损失和准确率
train_losses = []
train_accuracies = []
val_losses = []
val_accuracies = []

# 循环训练
for epoch in range(num_epochs):
    # epoch：把训练集中的数据训练一遍
    model.train()
    running_loss, running_correct, n_samples = 0.0, 0, 0
    #batch = 0  # 初始化 batch

    # 每个 epoch 训练 60000 张图片，经过 938 个 batch。
    pbar = tqdm(train_dataloader, desc=f"Epoch {epoch+1}/{num_epochs}", colour="green")
    # 训练进度条调整为绿色，支持 green / yellow / red。
    for imgs, labels in pbar:
        imgs, labels = imgs.to(device), labels.to(device)  # 使用 CUDA 加速训练
        optimizer.zero_grad()              # 初始化梯度，清空梯度。注意清空优化器的梯度，防止累计。
        outputs = model(imgs)              # 神经网络前向传播
        loss = loss_func(outputs, labels)  # 整个 batch 的平均损失值
        loss.backward()                    # 通过反向传播（BP）计算梯度
        optimizer.step()                   # 通过梯度更新神经网络中的可学习参数（权重和偏置）
        
        #running_loss += loss.item()
        #correct += (outputs.argmax(1) == labels).sum().item()

        # 累积指标
        running_loss += loss.item() * labels.size(0)
        running_correct += (outputs.argmax(1) == labels).sum().item()
        n_samples += labels.size(0)
        #batch += 1  # 每个 epoch 的 batch 总数（938）

        # 实时更新每个 batch 进度条后缀
        pbar.set_postfix(loss=running_loss / n_samples,
                        acc=running_correct / n_samples)

    #print("n_samples: ", n_samples)  → 60000
    #print("batch: ", batch)  → 938
    # epoch 结束后得到最终平均值
    epoch_loss = running_loss / n_samples
    epoch_acc = running_correct / n_samples
    print(f"→ Train | loss: {epoch_loss:.4f}  acc: {epoch_acc:.4f}")

    # 将每个 epoch 的损失值与准确率追加至对应数组中
    #train_losses.append(running_loss / len(train_dataloader))
    train_losses.append(epoch_loss)
    #train_accuracies.append(running_correct / len(train_dataloader.dataset))
    train_accuracies.append(epoch_acc)

    print("train_losses: ", train_losses)
    print("train_accuracies: ", train_accuracies)

    model.eval()
    running_loss, running_correct = 0.0, 0

    for imgs, labels in tqdm(test_dataloader, desc="Valid", leave=True, colour="yellow"):
        # leave=False 参数：验证过程完毕不保留进度条，反之保留。
        imgs, labels = imgs.to(device), labels.to(device)  # 使用 CUDA 加速训练
        with torch.no_grad():
            outputs = model(imgs)
            loss = loss_func(outputs, labels)
            #running_loss += loss.item()
            #running_correct += (outputs.argmax(1) == labels).sum().item()

            running_loss += loss.item() * labels.size(0)
            running_correct += (outputs.argmax(1) == labels).sum().item()

    #val_losses.append(running_loss / len(test_dataloader))
    val_losses.append(running_loss / len(test_dataloader.dataset))
    #val_accuracies.append(running_correct / len(test_dataloader.dataset))
    val_accuracies.append(running_correct / len(test_dataloader.dataset))

    print("val_losses: ", val_losses)
    print("val_accuracies: ", val_accuracies)

# 保存训练的结果（包括模型和参数）
torch.save(model.state_dict(), "mnist_cnn_pytorch.pth")  # 保存模型权重

# 保存模型为HDF5格式
torch.save(model, "mnist_cnn_pytorch.h5")

# 绘制损失图
plt.figure(figsize=(12, 4))
plt.subplot(1, 2, 1)
plt.plot(train_losses, color='tab:green', label='Train Loss')
plt.plot(val_losses, color='tab:red', label='Validation Loss')
plt.title('Loss During Training')
plt.xlabel('Epochs')
plt.ylabel('Loss')
plt.legend()

ax = plt.gca()
plt.grid(True, which='both', axis='both', linestyle='--', linewidth=0.5, alpha=0.5)

# 绘制准确率图
plt.figure(figsize=(12, 4))
plt.subplot(1, 2, 2)
plt.plot(train_accuracies, label='Train Accuracy')
plt.plot(val_accuracies, label='Validation Accuracy')
plt.title('Accuracy During Training')
plt.xlabel('Epochs')
plt.ylabel('Accuracy')
plt.legend()

ax = plt.gca()
plt.grid(True, which='both', axis='both', linestyle='--', linewidth=0.5, alpha=0.5)

plt.show()
