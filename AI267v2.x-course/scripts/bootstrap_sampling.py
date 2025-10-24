# 待测试学习
import numpy as np
import pandas as pd
from sklearn.datasets import fetch_openml
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_squared_error
from sklearn.utils import resample   # 用来 Bootstrap 采样
import matplotlib.pyplot as plt

# 1. 取数据：只用 2 个特征方便可视化
X, y = fetch_openml(name="house_prices", as_frame=True, return_X_y=True)
use_cols = ['GrLivArea', 'OverallQual']
X = X[use_cols].dropna().astype(float)
y = y.loc[X.index].astype(float)
X, y = X.values, y.values

# 2. 划分“大池”与测试点
pool_size = 600
np.random.seed(42)
idx = np.random.choice(len(X), pool_size, replace=False)
X_pool, y_pool = X[idx], y[idx]

# 选 100 个固定测试点
X_test, y_test = X_pool[:100], y_pool[:100]

# 3. 两种模型：线性（低复杂度） vs 12 次多项式（高复杂度）
def build_model(degree):
    return LinearRegression() if degree == 1 else \
           Pipeline([('poly', PolynomialFeatures(degree=degree, include_bias=False)),
                     ('lin', LinearRegression())])

# 4. Bootstrap 采样 M=100 轮
M = 100
degrees = [1, 12]
results = {deg: {'preds': []} for deg in degrees}

for deg in degrees:
    for m in range(M):
        # 有放回采样
        boot_idx = np.random.choice(pool_size, size=pool_size, replace=True)
        X_boot, y_boot = X_pool[boot_idx], y_pool[boot_idx]
        model = build_model(deg).fit(X_boot, y_boot)
        y_pred = model.predict(X_test)   # 形状 (100,)
        results[deg]['preds'].append(y_pred)

# 5. 计算 Bias², Variance, Noise
noise = np.var(y_test)                 # 近似不可约误差
for deg in degrees:
    preds = np.array(results[deg]['preds'])  # (M, 100)
    y_bar = preds.mean(axis=0)               # (100,)
    bias2 = np.mean((y_bar - y_test)**2)
    var = np.mean(np.var(preds, axis=0, ddof=1))
    print(f'degree={deg}: Bias²={bias2:.2e}, Variance={var:.2e}, Noise≈{noise:.2e}')

# 6. 画 Bias-Variance 图
deg_range = range(1, 15)
bv = []
for d in deg_range:
    preds = np.array([build_model(d).fit(
            *resample(X_pool, y_pool)).predict(X_test) for _ in range(M)])
    bias2 = np.mean((preds.mean(0) - y_test)**2)
    var = np.mean(np.var(preds, 0, ddof=1))
    bv.append([bias2, var])

plt.plot(deg_range, [b for b, v in bv], label='Bias²')
plt.plot(deg_range, [v for b, v in bv], label='Variance')
plt.plot(deg_range, [b+v+noise for b, v in bv], label='Total Error')
plt.xlabel('Polynomial degree')
plt.ylabel('Squared error')
plt.legend()
plt.show()