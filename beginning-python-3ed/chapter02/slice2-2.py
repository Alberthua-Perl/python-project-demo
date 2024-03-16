#!/usr/bin/env python
# 从类似于 http://www.something.com 的 URL 中提取域名

# input 函数返回字符串同样是序列（列表是序列的一种类型）
url = input("Please enter the URL: ")
domain = url[11:-4]

print("Domain name: " + domain)
