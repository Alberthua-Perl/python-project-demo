"""
绘制生成 f(x,y) = x**2 + y**2 图像（凸函数图像）与等高线，
而 f(x,y) = x**2 - y**2 图像为马鞍面。
"""
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

# 定义函数
def f(x, y):
    return x**2 + y**2

# 生成网格数据
x = np.linspace(-5, 5, 100)
y = np.linspace(-5, 5, 100)
X, Y = np.meshgrid(x, y)
Z = f(X, Y)

### 绘制曲面图过程
# 创建三维坐标系
fig = plt.figure(figsize=(10, 8))
ax = fig.add_subplot(111, projection='3d')

# 绘制曲面图
surf = ax.plot_surface(X, Y, Z, 
                       cmap='viridis',   # 颜色映射
                       edgecolor='none', 
                       alpha=0.8)

# 添加颜色条
fig.colorbar(surf, shrink=0.5, aspect=5)

# 设置标签和标题
ax.set_xlabel('x')
ax.set_ylabel('y')
ax.set_zlabel('z')
ax.set_title('3D Surface Plot of f(x, y) = x² + y²')

# 调整视角
ax.view_init(elev=30, azim=45)  # 仰角30度，方位角45度

plt.show()


'''### 绘制二维等高线图过程
plt.figure(figsize=(8, 6))
contour = plt.contour(X, Y, Z, 
                      levels=20,         # 等高线数量
                      cmap='RdYlBu')     # 红-黄-蓝颜色映射
plt.colorbar(contour, label='z value')

# 添加标签和标题
plt.xlabel('x')
plt.ylabel('y')
plt.title('Contour Plot of f(x, y) = x² - y²')
plt.grid(True)

plt.show()
'''