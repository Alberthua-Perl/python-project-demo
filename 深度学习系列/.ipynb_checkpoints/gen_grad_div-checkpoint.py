import numpy as np
import matplotlib.pyplot as plt

# 定义函数及其梯度、散度
def f(x, y):
    return x**2 - y**2  # 示例二元函数

def gradient_x(x, y):
    return 2*x  # ∂f/∂x

def gradient_y(x, y):
    return -2*y  # ∂f/∂y

def divergence(x, y):
    return 2 + (-2)  # 梯度场的散度 (∂²f/∂x² + ∂²f/∂y²)

# 生成网格数据
x = np.linspace(-2, 2, 20)
y = np.linspace(-2, 2, 20)
X, Y = np.meshgrid(x, y)

# 计算梯度向量场和散度
U = gradient_x(X, Y)  # 梯度x分量
V = gradient_y(X, Y)  # 梯度y分量
Div = divergence(X, Y) * np.ones_like(X)  # 散度（此处为常数）

# 绘制梯度向量场
plt.figure(figsize=(10, 8))
plt.quiver(X, Y, U, V, 
           color='blue', 
           angles='xy', 
           scale_units='xy', 
           scale=30, 
           width=0.004,
           headwidth=5,
           label='Gradient Vector Field')

# 绘制散度分布（此处为常数）
plt.imshow(Div, 
           extent=[-2, 2, -2, 2], 
           cmap='RdYlBu', 
           alpha=0.4,
           origin='lower')
plt.colorbar(label='Divergence')

# 添加标签和标题
plt.xlabel('x')
plt.ylabel('y')
plt.title('Gradient Field and Divergence of f(x, y) = x² - y²')
plt.legend()
plt.grid(True)
plt.show()