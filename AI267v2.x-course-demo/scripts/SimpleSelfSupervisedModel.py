# 待测试学习
# 代码示例：一个简单的自监督学习模型
import torch
import torch.nn as nn
import torch.optim as optim

class SimpleSelfSupervisedModel(nn.Module):
    def __init__(self):
        super(SimpleSelfSupervisedModel, self).__init__()
        self.encoder = nn.Linear(100, 50)
        self.decoder = nn.Linear(50, 100)

    def forward(self, x):
        encoded = torch.relu(self.encoder(x))
        decoded = torch.relu(self.decoder(encoded))
        return decoded

# 初始化模型、优化器和损失函数
model = SimpleSelfSupervisedModel()
optimizer = optim.Adam(model.parameters(), lr=0.001)
criterion = nn.MSELoss()

# 训练过程中的损失计算
input_data = torch.randn(10, 100)
output = model(input_data)
loss = criterion(output, input_data)
loss.backward()
optimizer.step()

# ================= 原训练代码之后 =================
import numpy as np
import matplotlib.pyplot as plt

def draw_horizontal_nodes(model, max_show=32):
    """
    水平节点图：一层一行圆点，只画权重非零连接
    """
    enc_w = model.encoder.weight.detach().cpu()   # [50, 100]
    dec_w = model.decoder.weight.detach().cpu()   # [100, 50]

    # 为了图简洁，只可视化前 max_show 个节点
    in_nodes  = min(enc_w.shape[1], max_show)
    hid_nodes = min(enc_w.shape[0], max_show)
    out_nodes = min(dec_w.shape[0], max_show)

    enc_w = enc_w[:hid_nodes, :in_nodes]
    dec_w = dec_w[:out_nodes, :hid_nodes]

    # 坐标系：层号 → x，节点号 → y
    layers = [in_nodes, hid_nodes, out_nodes]
    x_coords = [0, 1, 2]          # 输入/隐藏/输出 的 x 位置
    y_coords = [np.arange(n) for n in layers]   # 每层的 y 位置

    #plt.figure(figsize=(6, 4))
    plt.figure(figsize=(10, 4))
    ax = plt.gca()

    # 画圆点
    for x, yc in zip(x_coords, y_coords):
        for y in yc:
            circle = plt.Circle((x, y), 0.12, color='steelblue', zorder=2)
            ax.add_patch(circle)

    # 画连线：只画权重绝对值前 30% 的边，避免图太密
    def plot_conn(w, x0, x1, thresh=0.3):
        w_flat = w.ravel()
        top = np.quantile(np.abs(w_flat), 1-thresh)
        for i in range(w.shape[0]):
            for j in range(w.shape[1]):
                if np.abs(w[i, j]) > top:
                    plt.plot([x0, x1], [j, i], color='gray', lw=0.5, alpha=0.6, zorder=1)

    plot_conn(enc_w.T, x_coords[0], x_coords[1])   # 输入→隐藏
    plot_conn(enc_w,   x_coords[1], x_coords[2])   # 隐藏→输出（用 encoder 权转置即可）

    #ax.set_xlim(-0.5, 2.5)
    ax.set_xlim(-0.7, 2.7)
    ax.set_ylim(-0.5, max(layers) - 0.5)
    ax.set_xticks(x_coords)
    ax.set_xticklabels(['Input\n(100)', 'Hidden\n(50)', 'Output\n(100)'])
    ax.set_ylabel('Node index (top 32)')
    ax.set_title('Self-Supervised Auto-Encoder – Horizontal Node View')
    ax.set_aspect('equal')
    plt.tight_layout()
    
    plt.show()
    # 保存为 SVG，矢量格式可无限放大
    #plt.savefig("ae_horizontal_nodes.svg",
    #            format='svg',
    #            bbox_inches='tight',
    #            transparent=False)
    #print("已保存 ae_horizontal_nodes.svg")            

# 训练完调用
draw_horizontal_nodes(model)