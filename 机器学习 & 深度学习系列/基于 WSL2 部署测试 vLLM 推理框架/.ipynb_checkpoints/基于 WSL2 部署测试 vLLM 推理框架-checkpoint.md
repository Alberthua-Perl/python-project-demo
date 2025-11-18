# **基于 WSL2 部署测试 vLLM 推理框架**

## **0. 目录**

- 1. 环境说明
- 2. 方案1：直接原生 Windows 11 环境中安装部署
  - 2.1 启用 Windows 文件系统长名称支持
  - 2.2 报错复现
- 3. 方案2：Fedora42 (WSL2) 环境中安装部署
  - 3.1 启用、安装 Linux 支持的 Windows 子系统 WSL2
  - 3.2 安装 WSL2 的 Linux 发行版
  - 3.3 vLLM 部署与依赖安装
  - 3.4 vLLM 部署常见报错与排查
- 4. 测试验证 vLLM 推理
 
## **1. 环境说明**

- vLLM 推理框架官方仅支持 GPU 运行环境，如果想在 CPU 环境安装部署，需要对 vLLM 的 CPU 源代码分支进行编译，且获得的推理效率在 GPU 环境的 1/3 左右。
- 因此，此次实验需安装 vLLM 推理框架至笔者的 Windows 11 环境（已集成 NVIDIA RTX 2000 Ada）中。
- 尝试以下方案安装部署：
  - ❌ 方案1：直接原生 Windows 11 环境中安装部署（不推荐）
  - ✔️ 方案2：Fedora42 (WSL2) 环境中安装部署（推荐）

## **2. 方案1：直接原生 Windows 11 环境中安装部署**

如下命令在 PowerShell 中执行安装：

```powershell
#Powershell 环境
> pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124  # 指定 pip 源安装 PyTorch 以支持 CUDA
> pip install vllm  # 安装 vLLM 推理框架
```

但在之后的安装过程中，将抛出以下报错，提示 Windows 不支持超过最大 260 字符的目录或文件名的命名，需要打开启用文件系统长名称支持。

<center><img src="images/win11-longpath-no-supported.png" style="width:80%"></center>

<center>图例：Windows 11 未启用文件系统长名称支持</center>

### **2.1 启用 Windows 文件系统长名称支持**

- 按下 `Win + R` 键打开 "运行" 对话框
- 在输入框中输入 `regedit`，然后按 `Enter` 键或点击 "确定"。
- 注册表编辑器将打开，按照下图中的路径修改注册表 `LongPathsEnabled` 的数值为 1，即启用功能。

<center><img src="images/win11-longpath-supported.png" style="width:80%"></center>

<center>图例：Windows 11 修改注册表以支持文件系统长名称</center>

- 修改完成后，重启系统使其生效。

### **2.2 报错复现**

- 重启成功后，依然执行 vLLM 安装等待安装完毕。
- 📢 但是，在后续执行 `from vllm import LLM` 语句时，抛出错误 "ModuleNotFoundError: No module named 'vllm._C'"。该错误说明 vLLM 的 C++/CUDA 扩展未编译成功，或者是下载的 whl 与当前的 CUDA/PyTorch 版本不兼容。
- 以上报错与兼容性问题在 Windows 11 中常见，因此，此方案不再继续实施，使用方案2来完成部署测试。

## **3. 方案2：Fedora42 (WSL2) 环境中安装部署**

### **3.1 启用、安装 Linux 支持的 Windows 子系统 WSL2**

- 如下图，进入 `控制面板 > 程序 > 启用或关闭 Windows 功能`，点击 "适用于 Linux 的 Windows 子系统"。

<center><img src="images/enable-win11-wsl2-subsystem.png" style="width:80%"></center>

<center>图例：启用 WSL2 子系统功能</center>

- 启用 WSL2 功能后需下载安装 WSL2，安装成功后重启系统使子系统生效。

```powershell
#Powershell 环境
> wsl --version                # 查看 WSL2 版本
> wsl --install                # 下载安装 WSL2 环境
> wsl --set-default-version 2  # 设置默认的 WSL 版本
```

<center><img src="images/wsl2-installed.png" style="width:80%"></center>

<center>图例：安装 WSL2</center>

### **3.2 安装 WSL2 的 Linux 发行版**

WSL2 的 Linux 发行版默认根文件系统安装路径：**`C:\Users\<username>\AppData\Local\wsl\{Distro_id}`**

```powershell
#PowerShell 环境
> wsl --list --online        # 查看在线的可用发行版实例
> wsl --install -d <Distro>  # 安装指定的发行版
> wsl --list --verbose       # 查看发行版的状态
> wsl -t <Distro>            # 关闭指定的发行版
> wsl --unregister <Distro>  # 删除指定的发行版根磁盘

> wsl -d <Distro>            # 指定发行版进行交互式环境（也可点击 Win 图标中的 Fedora 图标进入环境）
```

<center><img src="images/wsl2-fedora-installed.png" style="width:80%"></center>

<center>图例：安装 WSL2 的 Fedora42 发行版</center>

### **3.3 vLLM 部署与依赖安装**

进入 Fedora42 环境后，直接在全局环境下安装 PyTorch 环境与 vLLM 框架：

```bash
$ nvidia-smi
Wed Nov 12 13:52:43 2025
+-----------------------------------------------------------------------------------------+
| NVIDIA-SMI 570.170                Driver Version: 573.44         CUDA Version: 12.8     |
|-----------------------------------------+------------------------+----------------------+
| GPU  Name                 Persistence-M | Bus-Id          Disp.A | Volatile Uncorr. ECC |
| Fan  Temp   Perf          Pwr:Usage/Cap |           Memory-Usage | GPU-Util  Compute M. |
|                                         |                        |               MIG M. |
|=========================================+========================+======================|
|   0  NVIDIA RTX 2000 Ada Gene...    On  |   00000000:01:00.0 Off |                  N/A |
| N/A   42C    P3              8W /   45W |       0MiB /   8188MiB |      0%      Default |
|                                         |                        |                  N/A |
+-----------------------------------------+------------------------+----------------------+

+-----------------------------------------------------------------------------------------+
| Processes:                                                                              |
|  GPU   GI   CI              PID   Type   Process name                        GPU Memory |
|        ID   ID                                                               Usage      |
|=========================================================================================|
|  No running processes found                                                             |
+-----------------------------------------------------------------------------------------+
# 确认 NVIDIA CUDA 驱动版本为 12.8 

$ sudo pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu124
# 指定对应 CUDA 版本的 pip 软件源，安装 PyTorch。

$ sudo dnf install gcc g++ python3-devel
# 安装 C/C++ 编译环境与 Python3 开发环境

$ sudo pip3 install vllm
# 编译安装 vllm 框架
```

### **3.4 vLLM 部署常见报错与排查**

1️⃣ 报错1：以下两类报错均由 vLLM 相关依赖包下载超时而导致的安装失败，可重新执行安装命令多次尝试。

```textfile
# 类型 1
× pip subprocess to install build dependencies did not run successfully.
│ exit code: 1
╰─> See above for output.

note: This error originates from a subprocess, and is likely not a problem with pip.

# 类型 2
pip._vendor.urllib3.exceptions.ReadTimeoutError: HTTPSConnectionPool(host='files.pythonhosted.org', port=443): Read timed out.
```

2️⃣ 报错2：Fedora42 环境中缺少 python3-devel 软件包导致的 vLLM 编译失败。

```textfile
  × Preparing metadata (pyproject.toml) did not run successfully.
  │ exit code: 1
  ╰─> [23 lines of output]
      + /usr/bin/python3 /tmp/pip-install-on03vce3/numpy_414050bbd7ac4b99ae9046ac56f18a81/vendored-meson/meson/meson.py setup /tmp/pip-install-on03vce3/numpy_414050bbd7ac4b99ae9046ac56f18a81 /tmp/pip-install-on03vce3/numpy_414050bbd7ac4b99ae9046ac56f18a81/.mesonpy-302f6p2r -Dbuildtype=release -Db_ndebug=if-release -Db_vscrt=md --native-file=/tmp/pip-install-on03vce3/numpy_414050bbd7ac4b99ae9046ac56f18a81/.mesonpy-302f6p2r/meson-python-native-file.ini
      The Meson build system
      Version: 1.2.99
      Source dir: /tmp/pip-install-on03vce3/numpy_414050bbd7ac4b99ae9046ac56f18a81
      Build dir: /tmp/pip-install-on03vce3/numpy_414050bbd7ac4b99ae9046ac56f18a81/.mesonpy-302f6p2r
      Build type: native build
      Project name: NumPy
      Project version: 1.26.4
      C compiler for the host machine: cc (gcc 15.2.1 "cc (GCC) 15.2.1 20251022 (Red Hat 15.2.1-3)")
      C linker for the host machine: cc ld.bfd 2.44-6
      C++ compiler for the host machine: c++ (gcc 15.2.1 "c++ (GCC) 15.2.1 20251022 (Red Hat 15.2.1-3)")
      C++ linker for the host machine: c++ ld.bfd 2.44-6
      Cython compiler for the host machine: cython (cython 3.0.12)
      Host machine cpu family: x86_64
      Host machine cpu: x86_64
      Program python found: YES (/usr/bin/python3)
      Found pkg-config: /usr/sbin/pkg-config (2.3.0)
      Run-time dependency python found: YES 3.13
      Has header "Python.h" with dependency python: NO

      ../meson.build:44:2: ERROR: Problem encountered: Cannot compile `Python.h`. Perhaps you need to install python-dev|python-devel
```

## **4. 测试验证 vLLM 推理**

### **4.1 测试 PyTorch 是否可调用 CUDA 驱动**

```python
import torch

print("torch version:", torch.__version__)
print("cuda available:", torch.cuda.is_available())
print("cuda version:", torch.version.cuda)
print("gpu device count:", torch.cuda.device_count())
```

```textfile
torch version: 2.6.0+cu124
cuda available: True
cuda version: 12.4
gpu device count: 1
```

### **4.2 测试 vLLM 是否可调用 CUDA 与 PyTorch**

导入加载 vllm 库：

```python
from vllm import LLM

print("vLLM imported ok.")
```

正确加载 vllm 后将返回以下结果：

```textfile
INFO 11-12 14:16:20 [__init__.py:216] Automatically detected platform cuda.
vLLM imported ok.
```

由于本地 GPU 显存限制（最大 8GB），下载量化后的 4bit 精度 granite-3.2-8b-instruct-bnb-4bit 模型执行推理：

```bash
$ python3 -m venv .vllm-venv
$ source .vllm-venv/bin/activate
$ pip3 install huggingface_hub
# 安装 huggingface-cli 命令行工具

$ mkdir models/ && cd models/
$ huggingface-cli download \
  unsloth/granite-3.2-8b-instruct-bnb-4bit \
  --local-dir ./granite-3.2-8b-instruct-bnb-4bit
# 下载 Huggingface 模型仓库中的指定模型至对应目录中
```

```bash
$ pip3 install bitsandbytes
$ vllm serve ./granite-3.2-8b-instruct-bnb-4bit \
  --quantization bitsandbytes \
  --load-format bitsandbytes \
  --max-model-len 2048 \
  --gpu-memory-utilization 0.80 \
  --dtype auto \
  --host 0.0.0.0 \
  --port 8000

$ sudo ss -tunlp | grep 8000
```

### **4.3 请求 vLLM 推理验证**
