"""
 测试 PyTorch 与 CUDA 集成

 - 安装 torch（集成 CUDA）：
   $ pip install torch torchvision torchaudio \
     torchmetrics rich tqdm \
     torchinfo \
     --index-url https://download.pytorch.org/whl/cu124

 - 确认 torch 是否支持 CUDA 与 cuDNN
 - 测试 CUDA 的计算性能
"""

import torch, psutil, os

# get cuda is or not supported
print('>>> Get PyTorch CUDA is or not supported...')
print(' ', torch.__version__)          # 2.x.x
print(' ', torch.version.cuda)         # 12.4
print(' ', torch.cuda.is_available())  # True
print(' ', torch.cuda.get_device_name(0))  # NVIDIA RTX 2000 Ada Generation

# verify cudnn path in windows
print('\n>>> Get CUDA and cuDNN version and path...')
print(' cuDNN version :', torch.backends.cudnn.version())  # 返回 8900 即 8.9.0
print(' CUDA  version :', torch.version.cuda)              # 应返回 12.4
dll_path = next(
  (m.path for m in psutil.Process().memory_maps() if m.path and
  m.path.endswith("cudnn64_8.dll")),
  None
)
print(' cudnn64_8.dll path :', dll_path)
# 重要说明：
#  cudnn64_8 链接在 torch 中已通过静态链接的方式编译进入此包，torch 不依赖系统级
#  cudnn64_8.dll。若系统中不存在此链接，torch 调用 CUDA 也不会报错。因此，以上 print()
#  函数返回 None。

# test CUDA compute ability
print('\n>>> Test CUDA compute ability...')
x = torch.rand(3, 3).cuda()
y = torch.matmul(x, x)
print(y)

"""
测试 TensorFlow 与 CUDA 集成
"""
import tensorflow as tf

print('\n>>> Get TensorFlow CUDA is or not supported...')
print("CUDA build ?", tf.test.is_built_with_cuda())
print("GPU devices", tf.config.list_physical_devices('GPU'))
