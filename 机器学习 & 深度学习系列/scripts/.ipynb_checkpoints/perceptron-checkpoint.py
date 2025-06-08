import pandas as pd
import torch
import torch.nn as nn

# 读取 CSV 文件
train_data_set = pd.read_csv("../data/train_data_set.csv")

# 选择前两列和最后一列
columns = train_data_set.columns
selected_columns_1 = train_data_set[[columns[0], columns[1]]]
selected_columns_2 = train_data_set[[columns[-1]]]

# 将数据转换为 PyTorch 张量
inputs = torch.tensor(selected_columns_1.values, dtype=torch.float32)
labels = torch.tensor(selected_columns_2.values, dtype=torch.float32).squeeze()

# 定义感知机模型
class Perceptron(nn.Module):
    def __init__(self):
        super(Perceptron, self).__init__()
        self.linear = nn.Linear(2, 1)  # 输入特征数为2，输出为1

    def forward(self, x):
        output = self.linear(x)
        return output  # 返回 logits

# 创建模型实例
model = Perceptron()

# 定义损失函数和优化器
criterion = nn.BCEWithLogitsLoss()  # 二分类交叉熵损失
optimizer = torch.optim.SGD(model.parameters(), lr=0.01)

# 训练模型
num_epochs = 1000
for epoch in range(num_epochs):
    # 前向传播
    outputs = model(inputs)
    outputs = torch.flatten(outputs)  # 将输出转换为一维张量
    loss = criterion(outputs, labels)

    # 反向传播和优化
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()

    if (epoch + 1) % 100 == 0:
        print(f'Epoch [{epoch + 1}/{num_epochs}], Loss: {loss.item():.4f}')

print('Finished Training')
