import sys
import requests
import json
from colorama import init, Fore, Style

"""
使用方法：$ python /path/to/chat_payload_cli.py
"""

def setup():
    MODEL = input("\n请输入模型名称：").strip()       #Qwen/Qwen3-4B-Instruct-2507
    ENDPOINT = input("请输入模型 IP:PORT：").strip()  #192.168.110.208:8000
    URL = f"http://{ENDPOINT}/v1/chat/completions"
    MAX_TOKENS = 2048
    TEMPERATURE = 0.2
    return MODEL, URL, MAX_TOKENS, TEMPERATURE  #返回变量

init(autoreset=True)

def main():
    MODEL, URL, MAX_TOKENS, TEMPERATURE = setup()  #加载变量
    MODEL_BASE = MODEL.split('/')[-1]  #返回列表 ['Qwen', 'Qwen3-4B-Instruct-2507']
    #MODEL_BASE = MODEL.rpartition('/')[-1]  #返回元组 ('Qwen', '/', 'Qwen3-4B-Instruct-2507')
    print(f"\n离线 {MODEL_BASE} 即将为您服务...")
    print("请提出您的问题，我会尽可能帮助您解答...")
    print("Ctrl+c 退出会话...\n")
    
    while True:
        try:
            prompt = input(f"🎉 {Fore.CYAN}尽管问:{Style.RESET_ALL} ").strip()
        except KeyboardInterrupt:
            print("\n会话已结束，再见！")
            sys.exit(0)
            
        payload = {
            "model": MODEL,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "max_tokens": MAX_TOKENS,
            "temperature": TEMPERATURE
        }
        
        #print(payload)  #debug
        
        try:
            response = requests.post(URL, json=payload, timeout=60)
            if (response.status_code == 200):
                outputs = response.json()
                #print(json.dumps(outputs, indent=4))  #debug
            else:
                response.raise_for_status()
            print(response.json()["choices"][0]["message"]["content"])
        except Exception as e:
            print(f"请求失败：{e}", file=sys.stderr)
            
        print("")
        
if __name__ == '__main__':
    main()
