#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PyTorch 张量初始化方法示例
演示多种常用的张量创建和初始化方式
"""

import torch  # 导入 PyTorch 库
import numpy as np  # 导入 NumPy 库，用于演示与 NumPy 的互操作


def test_random_tensors():
    """测试随机数张量初始化方法"""
    print("=" * 60)
    print("1. 随机数张量初始化")
    print("=" * 60)

    # 创建均匀分布的随机张量，值在 [0, 1) 之间
    rand_tensor = torch.rand([2, 3])  # 2 行 3 列的随机张量
    print(f"均匀分布随机张量 torch.rand([2, 3]):\n{rand_tensor}\n")

    # 创建标准正态分布的随机张量，均值为 0，标准差为 1
    randn_tensor = torch.randn([2, 3])  # 2 行 3 列的正态分布随机张量
    print(f"正态分布随机张量 torch.randn([2, 3]):\n{randn_tensor}\n")

    # 创建指定范围内的随机整数张量
    randint_tensor = torch.randint(0, 10, [2, 3])  # 值在 [0, 10) 之间的随机整数
    print(f"随机整数张量 torch.randint(0, 10, [2, 3]):\n{randint_tensor}\n")

    # 创建 4 维随机张量，演示多维结构
    rand_4d = torch.rand([2, 4, 3, 5])  # 2 组，每组 4 个 3x5 的矩阵
    print(f"4 维随机张量 torch.rand([2, 4, 3, 5]):")
    print(f"  形状: {rand_4d.shape}")
    print(f"  第一个 3x5 矩阵:\n{rand_4d[0][0]}\n")


def test_constant_tensors():
    """测试常量张量初始化方法"""
    print("=" * 60)
    print("2. 常量张量初始化")
    print("=" * 60)

    # 创建全零张量
    zeros_tensor = torch.zeros([2, 3])  # 2 行 3 列的全零张量
    print(f"全零张量 torch.zeros([2, 3]):\n{zeros_tensor}\n")

    # 创建全一张量
    ones_tensor = torch.ones([2, 3])  # 2 行 3 列的全一张量
    print(f"全一张量 torch.ones([2, 3]):\n{ones_tensor}\n")

    # 创建填充特定值的张量
    full_tensor = torch.full([2, 3], 7.5)  # 2 行 3 列，所有元素都是 7.5
    print(f"填充特定值张量 torch.full([2, 3], 7.5):\n{full_tensor}\n")

    # 创建单位矩阵（对角线为 1，其余为 0）
    eye_tensor = torch.eye(3)  # 3x3 单位矩阵
    print(f"单位矩阵 torch.eye(3):\n{eye_tensor}\n")


def test_sequence_tensors():
    """测试序列张量初始化方法"""
    print("=" * 60)
    print("3. 序列张量初始化")
    print("=" * 60)

    # 创建等差数列张量，类似 Python 的 range()
    arange_tensor = torch.arange(0, 10, 2)  # 从 0 到 10（不含），步长为 2
    print(f"等差数列 torch.arange(0, 10, 2):\n{arange_tensor}\n")

    # 创建线性间隔张量，指定起点、终点和元素个数
    linspace_tensor = torch.linspace(0, 1, 5)  # 从 0 到 1，均匀分成 5 个点
    print(f"线性间隔 torch.linspace(0, 1, 5):\n{linspace_tensor}\n")

    # 创建对数间隔张量
    logspace_tensor = torch.logspace(0, 2, 5)  # 10^0 到 10^2，对数间隔 5 个点
    print(f"对数间隔 torch.logspace(0, 2, 5):\n{logspace_tensor}\n")


def test_from_data():
    """测试从已有数据创建张量"""
    print("=" * 60)
    print("4. 从已有数据创建张量")
    print("=" * 60)

    # 从 Python 列表创建张量
    list_data = [[1, 2, 3], [4, 5, 6]]  # 2x3 的列表
    tensor_from_list = torch.tensor(list_data)  # 转换为张量
    print(f"从列表创建 torch.tensor([[1,2,3],[4,5,6]]):\n{tensor_from_list}\n")

    # 从 NumPy 数组创建张量
    numpy_array = np.array([[1.0, 2.0], [3.0, 4.0]])  # NumPy 数组
    tensor_from_numpy = torch.from_numpy(numpy_array)  # 转换为张量（共享内存）
    print(f"从 NumPy 创建 torch.from_numpy():\n{tensor_from_numpy}\n")

    # 使用 torch.as_tensor() 创建（也共享内存）
    as_tensor = torch.as_tensor(numpy_array)  # 与 from_numpy 类似
    print(f"使用 as_tensor 创建:\n{as_tensor}\n")


def test_like_tensors():
    """测试基于已有张量创建新张量"""
    print("=" * 60)
    print("5. 基于已有张量创建新张量")
    print("=" * 60)

    # 创建一个参考张量
    reference = torch.tensor([[1, 2], [3, 4]])  # 2x2 张量
    print(f"参考张量:\n{reference}\n")

    # 创建与参考张量形状相同的全零张量
    zeros_like = torch.zeros_like(reference)  # 形状与 reference 相同
    print(f"zeros_like:\n{zeros_like}\n")

    # 创建与参考张量形状相同的全一张量
    ones_like = torch.ones_like(reference)  # 形状与 reference 相同
    print(f"ones_like:\n{ones_like}\n")

    # 创建与参考张量形状相同的随机张量
    rand_like = torch.rand_like(reference.float())  # 需要浮点类型
    print(f"rand_like:\n{rand_like}\n")


def test_empty_tensors():
    """测试未初始化张量"""
    print("=" * 60)
    print("6. 未初始化张量（内存中的随机值）")
    print("=" * 60)

    # 创建未初始化的张量，内容是内存中的随机值
    empty_tensor = torch.empty([2, 3])  # 2 行 3 列，未初始化
    print(f"未初始化张量 torch.empty([2, 3]):\n{empty_tensor}")
    print("注意：empty 张量的值是未定义的，每次运行可能不同\n")


def test_tensor_properties():
    """测试张量的基本属性"""
    print("=" * 60)
    print("7. 张量的基本属性")
    print("=" * 60)

    # 创建一个测试张量
    test_tensor = torch.randn([2, 3, 4])  # 3 维张量

    print(f"张量内容:\n{test_tensor}\n")
    print(f"形状 (shape): {test_tensor.shape}")  # 张量的形状
    print(f"维度数 (ndim): {test_tensor.ndim}")  # 张量的维度数
    print(f"元素总数 (numel): {test_tensor.numel()}")  # 张量的元素总数
    print(f"数据类型 (dtype): {test_tensor.dtype}")  # 张量的数据类型
    print(f"设备 (device): {test_tensor.device}")  # 张量所在的设备（CPU 或 GPU）
    print(f"是否需要梯度 (requires_grad): {test_tensor.requires_grad}\n")  # 是否参与梯度计算


def test_dtype_and_device():
    """测试指定数据类型和设备"""
    print("=" * 60)
    print("8. 指定数据类型和设备")
    print("=" * 60)

    # 创建不同数据类型的张量
    float32_tensor = torch.ones([2, 2], dtype=torch.float32)  # 32 位浮点数
    float64_tensor = torch.ones([2, 2], dtype=torch.float64)  # 64 位浮点数
    int32_tensor = torch.ones([2, 2], dtype=torch.int32)  # 32 位整数
    bool_tensor = torch.ones([2, 2], dtype=torch.bool)  # 布尔类型

    print(f"float32 张量:\n{float32_tensor}, dtype={float32_tensor.dtype}\n")
    print(f"float64 张量:\n{float64_tensor}, dtype={float64_tensor.dtype}\n")
    print(f"int32 张量:\n{int32_tensor}, dtype={int32_tensor.dtype}\n")
    print(f"bool 张量:\n{bool_tensor}, dtype={bool_tensor.dtype}\n")

    # 检查 CUDA 是否可用
    if torch.cuda.is_available():  # 如果有 GPU
        cuda_tensor = torch.ones([2, 2], device='cuda')  # 在 GPU 上创建张量
        print(f"CUDA 张量:\n{cuda_tensor}, device={cuda_tensor.device}\n")
    else:
        print("CUDA 不可用，跳过 GPU 张量创建\n")


def main():
    """主函数，运行所有测试"""
    print("\n" + "=" * 60)
    print("PyTorch 张量初始化方法完整示例")
    print("=" * 60 + "\n")

    # 设置随机种子，确保结果可复现
    torch.manual_seed(42)  # 设置随机种子为 42
    np.random.seed(42)  # 设置 NumPy 随机种子

    # 运行所有测试函数
    test_random_tensors()  # 测试随机数张量
    test_constant_tensors()  # 测试常量张量
    test_sequence_tensors()  # 测试序列张量
    test_from_data()  # 测试从数据创建张量
    test_like_tensors()  # 测试基于已有张量创建
    test_empty_tensors()  # 测试未初始化张量
    test_tensor_properties()  # 测试张量属性
    test_dtype_and_device()  # 测试数据类型和设备

    print("=" * 60)
    print("所有测试完成！")
    print("=" * 60)


if __name__ == "__main__":
    main()  # 运行主函数
