# logistic_multiclass_iris.py
import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.multiclass import OneVsRestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix, ConfusionMatrixDisplay, RocCurveDisplay
)

# 1. 数据
X, y = load_iris(return_X_y=True)

# 2. 训练/测试拆分
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=42, stratify=y)

# 3. 管道：标准化 + 逻辑回归
pipe = Pipeline(steps=[
    ('scaler', StandardScaler()),
    ('clf', OneVsRestClassifier(
         LogisticRegression(max_iter=1000,
                            class_weight='balanced')))
])

pipe.fit(X_train, y_train)

# 4. 预测与评估
y_score = pipe.predict_proba(X_test)
y_pred = pipe.predict(X_test)
print("Accuracy:", round(accuracy_score(y_test, y_pred), 3))
print("\nClassification Report:\n", classification_report(y_test, y_pred))

# 5. 混淆矩阵
cm = confusion_matrix(y_test, y_pred)
disp = ConfusionMatrixDisplay(confusion_matrix=cm,
                              display_labels=load_iris().target_names)
disp.plot(cmap='Blues')
plt.title("Logistic Regression – Iris Confusion Matrix")
plt.show()

# 6. 为 3 类分别绘制 ROC 曲线
plt.figure(figsize=(6, 5))
for idx, cls_name in enumerate(load_iris().target_names):
    RocCurveDisplay.from_predictions(
        y_test == idx,
        y_score[:, idx],
        name=f"vs {cls_name}",
    )
    ax = plt.gca()
    ax.gca()
    plt.title(f"ROC – {cls_name} vs Rest (Logistic Regression on Iris)")
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.grid(True)
    plt.show()