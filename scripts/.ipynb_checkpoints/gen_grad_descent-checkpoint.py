"""
绘制二元函数 f(x,y) = x**2 + y**2 的梯度下降路径
"""
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

# 定义一个简单的函数，例如二次函数
def f(x, y):
    return x**2 + y**2

# 计算梯度
def gradient(x, y):
    return 2*x, 2*y

# 梯度下降函数
def gradient_descent(start_x, start_y, learning_rate, iterations):
    x_history = [start_x]
    y_history = [start_y]
    x, y = start_x, start_y
    for _ in range(iterations):
        dx, dy = gradient(x, y)
        x -= learning_rate * dx
        y -= learning_rate * dy
        x_history.append(x)
        y_history.append(y)
    return x_history, y_history

# 设置初始参数
start_x = 3.0
start_y = 4.0
learning_rate = 0.1
iterations = 10

# 运行梯度下降
x_history, y_history = gradient_descent(start_x, start_y, learning_rate, iterations)

# 创建网格
x = np.linspace(-5, 5, 100)
y = np.linspace(-5, 5, 100)
X, Y = np.meshgrid(x, y)
Z = f(X, Y)

# 创建3D图
fig = plt.figure(figsize=(12, 8))
ax = fig.add_subplot(111, projection='3d')

# 绘制曲面
surf = ax.plot_surface(X, Y, Z, cmap='viridis', alpha=0.7, linewidth=0, antialiased=False)

# 绘制梯度下降路径
ax.scatter(start_x, start_y, f(start_x, start_y), color='black', s=100, label='Start')
for i in range(len(x_history)-1):
    ax.plot([x_history[i], x_history[i+1]],
            [y_history[i], y_history[i+1]],
            [f(x_history[i], y_history[i]), f(x_history[i+1], y_history[i+1])],
            color='black', marker='o', markersize=5)

# 添加箭头表示方向
for i in range(len(x_history)-1):
    ax.quiver(x_history[i], y_history[i], f(x_history[i], y_history[i]),
              x_history[i+1]-x_history[i], y_history[i+1]-y_history[i],
              f(x_history[i+1], y_history[i+1])-f(x_history[i], y_history[i]),
              color='black', arrow_length_ratio=0.2)

# 设置标签和标题
ax.set_xlabel('X')
ax.set_ylabel('Y')
ax.set_zlabel('Z')
ax.set_title('Gradient Descent Visualization')

# 添加等高线图
fig2, ax2 = plt.subplots(figsize=(6, 6))
contour = ax2.contour(X, Y, Z, levels=20, cmap='viridis')
ax2.clabel(contour, inline=True, fontsize=8)
ax2.plot(x_history, y_history, color='black', marker='o', markersize=5)
ax2.scatter(start_x, start_y, color='black', s=100, label='Start')
ax2.set_xlabel('X')
ax2.set_ylabel('Y')
ax2.set_title('Contour Plot of Gradient Descent')

plt.show()