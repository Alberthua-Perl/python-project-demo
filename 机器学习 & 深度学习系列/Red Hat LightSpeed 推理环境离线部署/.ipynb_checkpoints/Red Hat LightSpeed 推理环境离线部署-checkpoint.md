# 🎯 **Red Hat LightSpeed 推理环境离线部署**

## **Red Hat LightSpeed 推理环境概要**

- 根据 [Red Hat 文档](https://docs.redhat.com/zh-cn/documentation/red_hat_enterprise_linux/10/html/interacting_with_the_command-line_assistant_powered_by_rhel_lightspeed/containerized-command-line-assistant-for-disconnected-environments)[<sup>[1]</sup>](#introduce) 中的说明，在网络不可用的情况下，即无法连接至在线 Red Hat LightSpeed API 的场景下，可在本地单系统中部署离线版 Red Hat LightSpeed 推理环境（**RHEL CLA**），此环境全部容器化方式实现。
- 推理环境的各容器说明：
  - **installer-rhel10** 容器：拉取其他必要的容器，安装 rhel-cla 命令，并选择性地创建 systemd 服务。
  - **rlsapi** 容器：用于提供命令行助手客户端（command-line-assistant）与之通信的端点（endpoint）。
  - **rag-database** 容器：包含检索增强生成（retrieval-augmented generation, RAG）数据库，通过 RHEL 文档等附加数据补充 LLM 知识。
  - **ramalama** 容器：执行 LLM 推理服务，其中运行 llama.cpp 模型服务运行时（model runtime），默认使用 `Phi-4-mini-instruct-Q4_K_M.gguf` 模型文件。
- 由 RHEL Lightspeed 提供支持的命令行助手，此工具可在本地节点安装，也可在能连接本地推理环境的节点上安装。
- 🔥 此推理环境可在纯 CPU 场景中运行，下文介绍 CPU 场景中的环境部署，但整体推理效率有待测试。

> 注意：当前离线版的 RHEL CLA 推理环境尚处于技术预览阶段，仅在个人开发环境中使用，切不要在生产环境中部署使用！

## **拉取安装所需容器镜像**

拉取 rhel-cla 相关容器镜像需要 Red Hat 账号与订阅，否则注册失败，无法拉取。

```bash
$ podman login registry.redhat.io  # 使用 Red Hat 账号登录
Username: 
Password: 
$ podman pull registry.redhat.io/rhel-cla/installer-rhel10:latest  # 此镜像容量在 2.6G 左右，拉取需要一定时间。
Trying to pull registry.redhat.io/rhel-cla/installer-rhel10:latest...
Getting image source signatures
Checking if image destination supports signatures
Copying blob dd6ea7701042 done
Copying blob 551849931ba0 done
Copying config 968e176caa done
Writing manifest to image destination
Storing signatures
968e176caa579e54489bf9cd59b8c3c7bd5d88d2149f729e926910404c4388cd
```

## **启动 installer-rhel10 容器**

[installer-rhel10 容器镜像](https://catalog.redhat.com/en/software/containers/rhel-cla/installer-rhel10/68af1cbe4a00895806fa0b48#get-this-image)[<sup>[2]</sup>](#installer-rhel10) 用于拉取其他所需容器，与启动推理环境，并选择性地创建 systemd 服务。

```bash
$ mkdir $HOME/.local/bin  # 创建容器映射目录
$ podman run -u : --rm \
  -v $HOME/.config:/config:Z -v $HOME/.local/bin:/config/.local/bin:Z \
  registry.redhat.io/rhel-cla/installer-rhel10:latest \
  install-systemd
⚠️  Red Hat Enterprise Linux (RHEL) command line assistant is a tool that uses AI technology. Do not include any personal information or other sensitive information in your input. Results should not be relied on without human review. More information available: https://red.ht/3JqbWuu.

ℹ️  Installing RHEL CLA systemd service...
✅ 🎉 RHEL RHEL CLA installed!

ℹ️  📁 Files installed:
   • Command: ~/.local/bin/rhel-cla
   • Config: ~/.config/rhel-cla/.env
   • Runner: ~/.config/rhel-cla/rhel-cla-runner.sh
   • Systemd service: ~/.config/systemd/user/rhel-cla.service

⚠️  ⚠️  Make sure ~/.local/bin is in your PATH:
   • For bash users:
 echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc'
   • For zsh users (macOS default):
 echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc'
   • For fish users:
 fish_add_path ~/.local/bin

ℹ️  🚀 Quick start:
   rhel-cla start    # Start RHEL CLA
   rhel-cla status   # Check status
   rhel-cla stop     # Stop RHEL CLA

ℹ️  📊 View logs:
   journalctl --user -u rhel-cla -f     # Follow logs

ℹ️  🗑️  Uninstall RHEL CLA:
   rhel-cla uninstall

$ echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc  # rhel-cla 命令所在目录
```

## **启动离线 RHEL CLA 推理环境**

- `rhel-cla start` 启动模型推理环境根据具体的硬件与网络环境消耗的时间不同。
- 启动的过程中需下载以下容器镜像，并且按照此顺序启动 Pod 中的各个容器：
  - 1️⃣ podman-pause:4.6.1-1692961697
  - 2️⃣ registry.redhat.io/rhel-cla/rag-database-rhel10:latest
  - 3️⃣ quay.io/ramalama/ramalama:latest
  - 4️⃣ registry.redhat.io/rhel-cla/rlsapi-rhel10:latest

```bash
$ rhel-cla start  # 此步根据具体的硬件与网络环境可能消耗时间不同，笔者的环境中大约需要 16~18min 使所有的容器就绪（ready）。
ℹ️  Starting RHEL CLA...
ℹ️  Systemd service detected, starting service
✅ RHEL CLA systemd service started
ℹ️  To enable automatic startup on boot, run: systemctl --user enable rhel-cla

$ rhel-cla status  # 查看本地推理环境状态
ℹ️  📊 RHEL CLA Status

ℹ️  RHEL CLA systemd service detected
   • Service status: active

✅ Pod exists

NAMES                    STATUS       PORTS
931d6c1eb2d1-infra       Up 24 hours  0.0.0.0:8000->8000/tcp, 0.0.0.0:8888->8888/tcp
rhel-cla-pgvector        Up 24 hours  0.0.0.0:8000->8000/tcp, 0.0.0.0:8888->8888/tcp
rhel-cla-llamacpp-model  Up 24 hours  0.0.0.0:8000->8000/tcp, 0.0.0.0:8888->8888/tcp
rhel-cla-rlsapi          Up 24 hours  0.0.0.0:8000->8000/tcp, 0.0.0.0:8888->8888/tcp

ℹ️  API Health:
✅ API responding at http://127.0.0.1:8000

# 可选步骤：查看本地推理环境状态，此环境可随系统启动而启动。
$ systemctl status --user --no-pager rhel-cla.service
● rhel-cla.service - RHEL CLA RAG System
     Loaded: loaded (/home/kiosk/.config/systemd/user/rhel-cla.service; enabled; preset: disabled)
     Active: active (exited) since Sat 2025-11-15 23:57:16 CST; 24h ago
       Docs: https://github.com/containers/podman/blob/main/docs/source/markdown/podman-systemd.unit.5.md
   Main PID: 5455 (code=exited, status=0/SUCCESS)
      Tasks: 19 (limit: 307801)
     Memory: 3.7G
        CPU: 1min 52.668s
     CGroup: /user.slice/user-1000.slice/user@1000.service/app.slice/rhel-cla.service
             ├─6067 /usr/bin/slirp4netns --disable-host-loopback --mtu=65520 --enable-sandbox --enable-seccomp --enable-ipv6 -c -r 3 -e 4 --netns-type=path /run/user/1000/netns/netns-7726…
             ├─6069 rootlessport
             ├─6075 rootlessport-child
             ├─6085 /usr/bin/conmon --api-version 1 -c cb598608982d1cc32284e39fb29e5ab2c2a1aea4d76b1eece5bf8868f0adad58 -u cb598608982d1cc32284e39fb29e5ab2c2a1aea4d76b1eece5bf8868f0adad58…
             ├─6090 /usr/bin/conmon --api-version 1 -c 0301c314e220337148f9bd313081f53f1330cab7b60d4268a85d7602bf1133f2 -u 0301c314e220337148f9bd313081f53f1330cab7b60d4268a85d7602bf1133f2…
             ├─7192 /usr/bin/conmon --api-version 1 -c 82e135cfd88e2d50815e44c81e2bba22f7e29b17633e9bc090ea9670c19b6214 -u 82e135cfd88e2d50815e44c81e2bba22f7e29b17633e9bc090ea9670c19b6214…
             └─9559 /usr/bin/conmon --api-version 1 -c 1507351121b40c4e6898b38250b371e0b157dd4b3362ff0ce4a7d8de081b9728 -u 1507351121b40c4e6898b38250b371e0b157dd4b3362ff0ce4a7d8de081b9728…
```

- 若要提升推理能力与效率，可增加推理线程数，如下所示：

  ```bash
  $ vim $HOME/.config/rhel-cla/rhel-cla-runner.sh
  ...
  # Add remaining options
  LLAMACPP_CMD="$LLAMACPP_CMD \
    --security-opt=label=disable \
    -e HF_HOME=/models/.cache/huggingface \
    -v llamacpp-models:/models:Z \
    --tmpfs /dev/shm:rw,size=10g \
    ${LLAMACPP_IMAGE} \
    ramalama --store /models --debug serve \
    --port ${MODELSERVER_PORT:-8888} \
    --host 0.0.0.0 \
    --threads 8 \  #新增此行，增加推理线程数。
    ${LLM_FOR_LLAMACPP}"
  ...

  $ systemctl --user daemon-reload
  $ systemctl --user restart rhel-cla.service
  ```

## **可选：启用 Fedora 42 的 command-line-assistant 软件源**

- Fedora 42 已被列入官方支持清单，并且 Red Hat 在 2025-09-16 的 [博客](https://www.redhat.com/en/blog/use-rhel-command-line-assistant-offline-new-developer-preview)[<sup>[3]</sup>](#cla-preview) 中明确把 Fedora 42 与 RHEL 9.6+/10+ 并列为 “仅 CPU” 和 “支持 GPU” 两种部署场景的适用系统。
- 此外，Fedora Copr 构建仓库也已存在 `@rhel-lightspeed/command-line-assistant` 的 Fedora 42 aarch64/x86_64 包，可通过以下方式安装。

```bash
$ sudo dnf copr enable @rhel-lightspeed/command-line-assistant
$ sudo dnf install -y command-line-assistant subscription-manager  # 安装 cla 工具与 RedHat 订阅管理器，后续用于容器镜像拉取认证。
```

- 📢 但是，在以上软件包安装完成后，运行 `c chat` 命令时返回 `CLI binary not found`，说明 c chat 安装不完整，目前还无法解决此问题，有待社区发布修复方法。

未完待续......

## **参考链接**

<div id="introduce"></div>

[1. 第 5 章 将容器化 RHEL 命令行助手用于断开连接的环境 | Red Hat Documentation](https://docs.redhat.com/zh-cn/documentation/red_hat_enterprise_linux/10/html/interacting_with_the_command-line_assistant_powered_by_rhel_lightspeed/containerized-command-line-assistant-for-disconnected-environments)

<div id="installer-rhel10"></div>

[2. Red Hat Enterprise Linux (RHEL) command line assistant installer | Red Hat Ecosystem Catalog](https://catalog.redhat.com/en/software/containers/rhel-cla/installer-rhel10/68af1cbe4a00895806fa0b48#get-this-image)

<div id="cla-preview"><div>

[3. Use the RHEL command-line assistant offline with this new developer preview | Red Hat Blog](https://www.redhat.com/en/blog/use-rhel-command-line-assistant-offline-new-developer-preview)
