'''
经典的房价预测数据集来演示如何实现预测任务

核心思路：
 1. 用多种回归指标（MAE、RMSE、MAPE、R²）量化“精确度”；
 2. 画四条图：
    - 真实值 vs 预测值散点（看整体偏差/异方差）
    - 残差直方图+KDE（看误差分布是否正态）
    - 残差 vs 预测值（看是否存在未捕获的非线性）
    - 学习曲线（训练/验证 loss 或 MAE 随 epoch 变化）
 3. 额外输出 10 折交叉验证的均值±标准差，防止“一次划分”带来的运气成分。

如何解读：
 1. MAPE ≤ 10 % → 模型对房价“相对误差”在可接受区间；
 2. R² ≥ 0.85 → 能解释 85 % 以上方差；
 3. 残差图若呈“漏斗形” → 存在异方差，考虑对数变换或加权损失；
 4. 残差均值偏离 0 → 系统偏差，可再加一层非线性或特征工程；
5. 交叉验证 std 很小 → 模型稳定，std 大说明对数据划分敏感，需更多数据或正则。
'''

import os, sys, io
import numpy as np, pandas as pd, tensorflow as tf
from sklearn.datasets import fetch_openml
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score  # 指标函数
import matplotlib.pyplot as plt  # 可视化函数
import seaborn as sns  # 可视化函数
from sklearn.model_selection import KFold  # 交叉验证

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
#解决报错：Windows 终端默认代码页是 GBK，而 \xb2（上标 ²）不在 GBK 编码范围内，导致打印时报 UnicodeEncodeError。

#os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"   # 0=全部, 1=INFO, 2=WARNING, 3=ERROR
#os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"  # 关闭 oneDNN 提示

# 指标函数
def regression_report(y_true, y_pred, X=None, model=None):
    """一站式打印常用回归指标"""
    mae  = mean_absolute_error(y_true, y_pred)
    #rmse = mean_squared_error(y_true, y_pred, squared=False)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    #解决报错：mean_squared_error 还没有 squared 参数（老版本用 squared=True 默认返回 MSE，没有开关控制）。
    r2   = r2_score(y_true, y_pred)
    mape = np.mean(np.abs((y_true - y_pred) / np.clip(y_true, 1e-3, None))) * 100
    print(f"MAE : {mae:8.3f}")
    print(f"RMSE: {rmse:8.3f}")
    print(f"R²  : {r2:8.3f}")
    print(f"MAPE: {mape:6.2f}%")
    return {"MAE": mae, "RMSE": rmse, "R2": r2, "MAPE": mape}
 
# 可视化函数
def plot_regression_evaluation(y_true, y_pred, figsize=(14, 4)):
    residual = y_true - y_pred
    plt.figure(figsize=figsize)

    # 1. 真实 vs 预测
    plt.subplot(1, 3, 1)
    sns.scatterplot(x=y_pred, y=y_true, alpha=0.6)
    plt.plot([y_true.min(), y_true.max()],
             [y_true.min(), y_true.max()], 'r--')
    plt.xlabel('Predicted'); plt.ylabel('Actual'); plt.title('Actual vs Predicted')

    # 2. 残差直方图
    plt.subplot(1, 3, 2)
    sns.histplot(residual, kde=True, bins=30, color='orange')
    plt.xlabel('Residual'); plt.title('Residual Distribution')

    # 3. 残差 vs 预测
    plt.subplot(1, 3, 3)
    sns.scatterplot(x=y_pred, y=residual, alpha=0.6)
    plt.axhline(0, color='red', linestyle='--')
    plt.xlabel('Predicted'); plt.ylabel('Residual'); plt.title('Residual vs Predicted')

    plt.tight_layout(); plt.show()

# 交叉验证
def cv_ann(model_builder, X, y, cv=10, epochs=100, batch_size=256):
    """
    对神经网络做 K 折交叉验证，返回各指标均值与标准差。
    model_builder 必须是一个 **函数**：每次折都重新 build & compile 新模型，
    防止权重共享导致数据泄漏。
    """
    metrics = []
    kf = KFold(n_splits=cv, shuffle=True, random_state=42)
    for train_idx, val_idx in kf.split(X):
        X_tr, X_val = X[train_idx], X[val_idx]
        y_tr, y_val = y[train_idx], y[val_idx]

        model = model_builder()                       # 重新构建
        model.fit(X_tr, y_tr,
                  validation_data=(X_val, y_val),
                  epochs=epochs, batch_size=batch_size,
                  callbacks=[tf.keras.callbacks.EarlyStopping(patience=15, restore_best_weights=True)],
                  verbose=0)
        y_pred = model.predict(X_val).ravel()
        metrics.append(regression_report(y_val, y_pred))
    df = pd.DataFrame(metrics)
    print("\n=== 10-CV 结果 ===")
    print(df.mean().add_suffix(' (mean)'))
    print(df.std().add_suffix(' (std)'))
    return df    

# 1. 加载并清洗
housing = fetch_openml(name="house_prices", as_frame=True)
X, y = housing.data, housing.target.astype(np.float32)

# 2. 划分
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42)

# 3. 预处理管道
num_cols = X.select_dtypes(include=['int64','float64']).columns
cat_cols = X.select_dtypes(include=['object','category','bool']).columns

num_pipe = Pipeline(steps=[
    ('impute', SimpleImputer(strategy='median')),
    ('scale', StandardScaler())
])

cat_pipe = Pipeline(steps=[
    ('impute', SimpleImputer(strategy='most_frequent')),
    ('onehot', OneHotEncoder(handle_unknown='ignore'))
])

pre = ColumnTransformer(
    transformers=[
        ('num', num_pipe, num_cols),
        ('cat', cat_pipe, cat_cols)
    ])

X_train = pre.fit_transform(X_train)
X_test  = pre.transform(X_test)

# 4. 建模
def build_model(hp=None):
    model = tf.keras.Sequential()
    model.add(tf.keras.layers.Input(shape=[X_train.shape[1]]))
    model.add(tf.keras.layers.Dense(256, activation='relu'))
    model.add(tf.keras.layers.BatchNormalization())
    model.add(tf.keras.layers.Dropout(0.3))
    model.add(tf.keras.layers.Dense(128, activation='relu'))
    model.add(tf.keras.layers.Dropout(0.3))
    model.add(tf.keras.layers.Dense(1, activation='linear'))
    model.compile(optimizer=tf.keras.optimizers.Adam(1e-3),
                  loss='mse', metrics=['mae'])
    return model

model = build_model()
cb = tf.keras.callbacks.EarlyStopping(patience=20, restore_best_weights=True)
history = model.fit(X_train, y_train,
                    validation_split=0.2,
                    epochs=500, batch_size=256,
                    callbacks=[cb], verbose=0)

# 5. 评估测试集
y_pred = model.predict(X_test).ravel()
#print('MAE :', mean_absolute_error(y_test, pred))
#print('RMSE:', np.sqrt(mean_squared_error(y_test, pred)))
print("===== 测试集评估 =====")
regression_report(y_test, y_pred)

# 6. 可视化
plot_regression_evaluation(y_test, y_pred)

# 7. 学习曲线（已经 history 里有了，再画一次更清晰）
plt.figure(figsize=(12,3))
plt.subplot(1,2,1); plt.plot(history.history['loss'], label='train'); plt.plot(history.history['val_loss'], label='val'); plt.title('Loss'); plt.legend()
plt.subplot(1,2,2); plt.plot(history.history['mae'], label='train'); plt.plot(history.history['val_mae'], label='val'); plt.title('MAE'); plt.legend()
plt.tight_layout(); plt.show()

# 8. 如果想看交叉验证（耗时，可选）
#cv_ann(build_model, X_train, y_train, epochs=300, batch_size=256)
