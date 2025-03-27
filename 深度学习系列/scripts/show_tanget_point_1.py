"""
绘制二元函数与切平面之间的切点
"""
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

# 定义二元函数
def f(x, y):
    return x**2 + y**2

# 定义计算切平面的函数
def tangent_plane(x, y, a, b):
    # 计算函数在点 (a, b) 处的值
    f_ab = f(a, b)
    # 计算函数在点 (a, b) 处的偏导数
    df_dx = 2 * a
    df_dy = 2 * b
    # 切平面方程：z = f(a, b) + df_dx*(x - a) + df_dy*(y - b)
    return f_ab + df_dx * (x - a) + df_dy * (y - b)

# 创建网格点
x = np.linspace(-5, 5, 100)
y = np.linspace(-5, 5, 100)
X, Y = np.meshgrid(x, y)
Z = f(X, Y)

# 指定切点
a, b = 1, 2
Z_tangent = tangent_plane(X, Y, a, b)

# 创建3D图形
fig = plt.figure(figsize=(12, 8))
ax = fig.add_subplot(111, projection='3d')

# 绘制二元函数曲面
ax.plot_surface(X, Y, Z, cmap='viridis', alpha=0.7, label='Function f(x, y)')

# 绘制切平面
ax.plot_surface(X, Y, Z_tangent, color='red', alpha=0.5, label='Tangent Plane')

# 绘制切点
ax.scatter(a, b, f(a, b), color='black', s=100, label='Point of Tangency')

# 添加标题和坐标轴标签
ax.set_title('3D Plot of Function and Tangent Plane')
ax.set_xlabel('X')
ax.set_ylabel('Y')
ax.set_zlabel('Z')

# 显示图例
ax.legend()

# 显示图形
plt.show()