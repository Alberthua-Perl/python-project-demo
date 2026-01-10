'''
获取 Ames House Prices 数据集，并将其保存为 csv 文件的方法。
'''

import sys, io
import pandas as pd
from sklearn.datasets import fetch_openml
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 1. 下载（若已缓存则直接读缓存）
housing = fetch_openml(name="house_prices", as_frame=True)
print(housing.data_filename)
print(housing.target_filename)

# 2. 合并特征与目标，得到一个完整表
df = housing.frame                 # 官方已拼好，直接可用
# 或者手动拼接：
# df = pd.concat([housing.data, housing.target], axis=1)

# 3. 存成原始 CSV（留底）
raw_dir = Path("data/raw")
raw_dir.mkdir(parents=True, exist_ok=True)
df.to_csv(raw_dir / "ames_housing_raw.csv", index=False)

# 4. 简单清洗示例
def clean(df: pd.DataFrame) -> pd.DataFrame:
    # 4.1 去掉全是缺失的列
    df = df.dropna(axis=1, how='all')
    # 4.2 把数值型里少量缺失填中位数
    num_cols = df.select_dtypes(include='number').columns
    df[num_cols] = df[num_cols].fillna(df[num_cols].median())
    # 4.3 类别型缺失填 "Missing"
    cat_cols = df.select_dtypes(include='category').columns
    df[cat_cols] = df[cat_cols].fillna("Missing")
    # 4.4 去掉异常值（示例：GrLivArea 过大的 2 条）
    df = df[df["GrLivArea"] < 4000]
    return df

df_clean = clean(df)

# 5. 存成清洗后 CSV
clean_dir = Path("data/processed")
clean_dir.mkdir(parents=True, exist_ok=True)
df_clean.to_csv(clean_dir / "ames_housing_clean.csv", index=False)

# 6. 也可以拆成 X/y 分别存
X = df_clean.drop(columns=["SalePrice"])
y = df_clean["SalePrice"]
X.to_csv(clean_dir / "X.csv", index=False)
y.to_csv(clean_dir / "y.csv", index=False, header=["SalePrice"])

print("CSV 已生成：")
#print(list(raw_dir.iterate()))  #Linux
print('Raw Dir: ', list(raw_dir.iterdir()))  #Windows
#print(list(clean_dir.iterate()))  #Linux
print('Clean Dir: ', list(clean_dir.iterdir()))  #Windows
