# logistic_roc_breast_cancer.py
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    RocCurveDisplay, roc_auc_score, confusion_matrix, ConfusionMatrixDisplay
)

# 1. 数据
X, y = load_breast_cancer(return_X_y=True)
feature_names = load_breast_cancer().feature_names

# 2. 训练/测试拆分
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=42, stratify=y)

# 3. 管道：标准化 + 逻辑回归
pipe = Pipeline(steps=[
    ('scaler', StandardScaler()),
    ('clf', LogisticRegression(max_iter=1000))
])
pipe.fit(X_train, y_train)

# 4. 预测概率 & 类别
y_score = pipe.predict_proba(X_test)[:, 1]
y_pred = pipe.predict(X_test)

# 5. 与恶性最相关的特征（系数绝对值）
coef = pd.Series(pipe.named_steps['clf'].coef_[0], index=feature_names)
top_malignant = coef.sort_values(key=abs, ascending=False).head(10)

print("与恶性 (Malignant) 最相关的 10 个特征：")
print(top_malignant)

# 6. 特征重要性条形图
plt.figure(figsize=(6, 4))
top_malignant.abs().sort_values(ascending=True).plot.barh()
plt.title("Top 10 Features Associated with Malignancy")
plt.xlabel("|Coefficient|")
plt.tight_layout()
plt.show()

# 7. 混淆矩阵
cm = confusion_matrix(y_test, y_pred)
disp = ConfusionMatrixDisplay(confusion_matrix=cm,
                              display_labels=['Benign', 'Malignant'])  # Benign：良性；Malignant：恶性
disp.plot(cmap='Reds')
plt.title("Confusion Matrix")
plt.show()

# 8. ROC 曲线
auc = roc_auc_score(y_test, y_score)
print(f"AUC = {auc:.3f}")

RocCurveDisplay.from_predictions(y_test, y_score)
plt.title("Breast Cancer Logistic Regression ROC")
plt.show()