"""
随机生成3列数据：
1. 第一列数据的值在10到35之间，第二列数据的值在15到90之间，第三列的值根据第二列的值进行判断。
2. 若第二列的值大于等于60，则标记为1；若第二列的值小于60，则标记为0。
"""
import numpy as np
import pandas as pd
import torch
import torch.nn as nn

# 设置随机种子以确保结果可重复
np.random.seed(42)

# 生成第一列数据：10 到 35 之间的随机整数，共 1000 个
col1 = np.random.randint(10, 36, size=1000)

# 生成第二列数据：15 到 90 之间的随机整数，共 1000 个
col2 = np.random.randint(15, 91, size=1000)

# 根据第二列数据生成第三列数据
col3 = [1 if x >= 60 else 0 for x in col2]

# 将数据组合成一个表格
data = pd.DataFrame({
    'Column1': col1,
    'Column2': col2,
    'Column3': col3
})

# 打印前几行数据以验证
print(data.head())

# 如果需要保存到文件，可以使用以下代码
data.to_csv('generated_data.csv', index=False)

# 将前两列转换为 PyTorch tensor
features = torch.tensor(data[['Column1', 'Column2']].values, dtype=torch.float32)

# 将第三列转换为标签
labels = torch.tensor(data['Column3'].values, dtype=torch.int64)

# 打印 tensor 的形状和前几行数据以验证
print("Features tensor shape:", features.shape)
print("Features tensor (first 5 rows):\n", features[:5])
print("\nLabels tensor shape:", labels.shape)
print("Labels tensor (first 5 elements):\n", labels[:5])
