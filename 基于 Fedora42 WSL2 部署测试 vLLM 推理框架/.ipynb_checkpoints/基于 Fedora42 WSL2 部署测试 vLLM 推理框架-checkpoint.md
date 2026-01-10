# **基于 Fedora42 WSL2 部署测试 vLLM 推理框架**

## **0. 目录**
 
## **1. 环境说明**

- vLLM 推理框架官方仅支持 GPU 运行环境，如果想在 CPU 环境安装部署，需要对 vllm 的 CPU 源代码分支进行编译，且获得的推理效率在 GPU 环境的 1/3 左右。
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

1️⃣ 报错1：以下两类报错均由 vllm 相关依赖包下载超时而导致的安装失败，可重新执行安装命令多次尝试。

```textfile
# 类型 1
× pip subprocess to install build dependencies did not run successfully.
│ exit code: 1
╰─> See above for output.

note: This error originates from a subprocess, and is likely not a problem with pip.

# 类型 2
pip._vendor.urllib3.exceptions.ReadTimeoutError: HTTPSConnectionPool(host='files.pythonhosted.org', port=443): Read timed out.
```

2️⃣ 报错2：Fedora42 环境中缺少 python3-devel 软件包导致的 vllm 编译失败。

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

1️⃣ 导入加载 vllm 库：

```python
from vllm import LLM

print("vLLM imported ok.")
```

2️⃣ 正确加载 vllm 后将返回以下结果：

```textfile
INFO 11-12 14:16:20 [__init__.py:216] Automatically detected platform cuda.
vLLM imported ok.
```

3️⃣ 创建 vllm 虚拟运行环境：

```bash
$ cd ~/backup
$ python3 -m venv .vllm-venv
$ source ~/backup/.vllm-venv/bin/activate
(.vllm-venv)$ pip3 install huggingface_hub
# 安装 huggingface-cli 命令行工具

(.vllm-venv)$ mkdir models/ && cd models/
(.vllm-venv)$ pwd
/home/alberthua/backup/models
(.vllm-venv)$ huggingface-cli download \
  unsloth/granite-3.2-8b-instruct-bnb-4bit \
  --local-dir ./granite-3.2-8b-instruct-bnb-4bit
# 兼容旧命令行使用：vllm 虚拟环境中下载 Hugging Face 模型仓库中的指定模型至对应目录中

(.vllm-venv)$ hf download \
  Qwen/Qwen3-4B-Instruct-2507-FP8 \
  --local-dir ./Qwen3-4B-Instruct-2507-FP8
# 新命令行使用：vllm 虚拟环境中下载 Qwen3 模型
```

4️⃣ 分别运行 Granite 与 Qwen3 模型：

```bash
## granite-3.2-8b-instruct-bnb-4bit 4bit 精度模型：由于本地 GPU 显存限制（最大 8GB），选择此模型推理。
(.vllm-venv)$ pip3 install bitsandbytes
(.vllm-venv)$ cd ~/backup/models  # 注意：请务必切换至模型所在的目录，vllm 启动时将此目录作为索引模型的根目录，否则无法找到模型而报错！
(.vllm-venv)$ vllm serve ./granite-3.2-8b-instruct-bnb-4bit \
  --quantization bitsandbytes \
  --load-format bitsandbytes \
  --max-model-len 2048 \
  --gpu-memory-utilization 0.80 \
  --dtype auto \
  --host 0.0.0.0 \
  --port 8000
```

<center><img src="images/vllm-start-log-1.png" style="width:80%"></center>

<center><img src="images/vllm-start-log-2.png" style="width:80%"></center>

<center><img src="images/vllm-start-log-3.png" style="width:80%"></center>

<center><img src="images/vllm-start-log-4.png" style="width:80%"></center>

<center>图例：vllm 启动过程（以上 4 张图）</center>

<center><img src="images/vllm-inference-log.png" style="width:80%"></center>

<center>图例：vllm 推理处理过程</center>

```bash
## Qwen3-4B-Instruct-2507-FP8 FP8 精度模型
(.vllm-venv)$ cd ~/backup/models
(.vllm-venv)$ vllm serve ./Qwen3-4B-Instruct-2507-FP8 \
  --max-model-len 5360 \
  --gpu-memory-utilization 0.80 \
  --dtype auto \
  --host 0.0.0.0 \
  --port 8000
```
<center><img src="images/vllm-qwen3-start-error-log.png" style="width:80%"></center>

<center>图例：由于指定错误的 --max-model-len 参数引起启动失败</center>

查看 vllm 是否监听 8000/tcp 端口：

```bash
$ sudo ss -tunlp | grep vllm
```

### **4.3 请求 vLLM 推理验证**

请求 vllm 推理验证可通过多种方式实现，以运行的 Qwen3 模型为例：

- 1️⃣ curl 命令行
- 2️⃣ 封装 curl 命令的 bash 脚本
- 3️⃣ pythn 客户端 chat 程序

1️⃣ 使用 curl 命令发送推理请求获取模型元数据：

```bash
$ cd ~/backup/models
$ curl -s http://192.168.110.209:8000/v1/models | jq .
{
  "object": "list",
  "data": [
    {
      "id": "./granite-3.2-8b-instruct-bnb-4bit",
      "object": "model",
      "created": 1763449103,
      "owned_by": "vllm",
      "root": "./granite-3.2-8b-instruct-bnb-4bit",
      "parent": null,
      "max_model_len": 2048,
      "permission": [
        {
          "id": "modelperm-3f38001072e64ebeaf9e9b7d9ac48722",
          "object": "model_permission",
          "created": 1763449103,
          "allow_create_engine": false,
          "allow_sampling": true,
          "allow_logprobs": true,
          "allow_search_indices": false,
          "allow_view": true,
          "allow_fine_tuning": false,
          "organization": "*",
          "group": null,
          "is_blocking": false
        }
      ]
    }
  ]
}
```

2️⃣ shell 实现方式：编写自定义交互式 chat 程序作为推理请求前端

```bash
$ cd ~/backup/models
$ vim ./chat_cli
```

```bash
#!/bin/bash

cd ~/backup/models  # 切换至与模型的相同路径
echo -e "\n离线 Granit 即将为您服务...\n"
echo "请提出您的问题，我会尽可能帮助您解答..."
echo -e "Ctrl+c 退出会话...\n"

MODEL="./Qwen3-4B-Instruct-2507-FP8"  # 指定加载的模型文件
#MODEL="./granite-4.0-h-1b"
#MODEL="./granite-3.2-8b-instruct-bnb-4bit"
MAX_TOKENS=5000
TEMPERATURE=0.2

while true; do
  #echo -ne "🎉 \033[36m尽管问:\033[0m "  # -n 选项：不换行，与输入的内容在同一行。
  printf "🎉 \033[36m尽管问:\033[0m "     # 与 echo -ne 等效写法
  read -r PROMPT
  #echo $PROMPT

  json=$(jq -n \
            --arg model "$MODEL" \
            --arg prompt "$PROMPT" \
            --arg max_tokens "$MAX_TOKENS" \
            --arg temperature "$TEMPERATURE" \
            '{model: $model,
              prompt: $prompt,
              max_tokens: $max_tokens,
              temperature: $temperature}'
        )

  curl -s -X POST http://192.168.110.209:8000/v1/completions \
    -H "Content-Type: application/json" \
    -d "$json" | jq -r .choices[0].text

  echo ""
done
```

```bash
$ chmod +x ./chat_cli
$ ./chat_cli

离线 Granit 即将为您服务...
请提出您的问题，我会尽可能帮助您解答...
Ctrl+c 退出会话...

🎉 尽管问: 

# 运行客户端推理请求程序即可本地实时推理
# 注意：打开另一个窗口，运行 nvidia-smi 命令监控 GPU 显存使用率。
```

## **参考链接**

- [unsloth/granite-3.2-8b-instruct-bnb-4bit | Hugging Face](https://huggingface.co/unsloth/granite-3.2-8b-instruct-bnb-4bit)
- [IBM Granit | Hugging Face](https://huggingface.co/ibm-granite)
- [ibm-granite/granite-4.0-350m | Hugging Face](https://huggingface.co/ibm-granite/granite-4.0-350m)
- [ibm-granite/granite-4.0-h-1b | Hugging Face](https://huggingface.co/ibm-granite/granite-4.0-h-1b)
- 🎉 [Qwen/Qwen3-4B-Instruct-2507-FP8 | Hugging Face](https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507-FP8)
