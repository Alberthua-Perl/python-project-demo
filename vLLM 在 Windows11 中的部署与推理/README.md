# vLLM 在 Windows11 中的部署与推理

- 运行 vLLM 推理服务器：

  ```bash
  $ ./run_vllm_win --help

  run_vllm_win.sh [OPTIONS]

    OPTIONS:

      --install-vllm    install vLLM
      --mc-download     download models from ModelScope
      --hf-download     download models from HuggingFace through token
      --run-vllm        run vLLM inference server
  ```

- 客户端模型测试
  - 方式 1：python 客户端运行
  
  ```bash
  $ python ./chat_payload_cli.py
  
  请输入模型名称：Qwen/Qwen3-4B-Instruct-2507
  请输入模型 IP:PORT：192.168.110.208:8880

  离线 Qwen3-4B-Instruct-2507 即将为您服务...
  请提出您的问题，我会尽可能帮助您解答...
  Ctrl+c 退出会话...

  🎉 尽管问: 
  ```
  
  - 方式 2：Web 端运行
  
  ```bash
  $ python -m http.server 8880  #运行 Web 服务端
  ```
  
  打开 Web 端访问测试模型。