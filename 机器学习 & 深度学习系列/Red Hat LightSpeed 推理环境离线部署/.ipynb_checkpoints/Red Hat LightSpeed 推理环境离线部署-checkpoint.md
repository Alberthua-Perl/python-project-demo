# **Red Hat LightSpeed 推理环境离线部署**

## LightSpeed 推理环境概要

根据 Red Hat<sup><a href="#ref-1" id="cite-1" >[1]</a></sup> 文档中的说明

## **拉取安装所需容器镜像**

```bash
$ podman login registry.redhat.io
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

$ echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
```

## **启动离线 LightSpeed 模型推理环境**

- `rhel-cla start` 启动模型推理环境根据具体的硬件与网络环境消耗的时间不同。
- 启动的过程中需下载以下容器镜像，并且按照此顺序启动 Pod 中的各个容器：
  - podman-pause:4.6.1-1692961697
  - registry.redhat.io/rhel-cla/rag-database-rhel10:latest
  - quay.io/ramalama/ramalama:latest
  - registry.redhat.io/rhel-cla/rlsapi-rhel10:latest

```bash
$ rhel-cla start  # 此步根据具体的硬件与网络环境可能消耗时间不同
ℹ️  Starting RHEL CLA...
ℹ️  Systemd service detected, starting service
✅ RHEL CLA systemd service started
ℹ️  To enable automatic startup on boot, run: systemctl --user enable rhel-cla
```

## **参考链接**

<div id="ref-1">
[1] <a ref="https://docs.redhat.com/zh-cn/documentation/red_hat_enterprise_linux/10/html/interacting_with_the_command-line_assistant_powered_by_rhel_lightspeed/index" target="_blank">与 RHEL Lightspeed 支持的命令行助手进行交互 | Red Hat Documentation</a>
</div>
- [Red Hat Enterprise Linux (RHEL) command line assistant installer | Red Hat Ecosystem Catalog](https://catalog.redhat.com/en/software/containers/rhel-cla/installer-rhel10/68af1cbe4a00895806fa0b48#get-this-image)








