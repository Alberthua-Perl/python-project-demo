#!/usr/bin/env python
# 检查用户名和 PIN 码

# 嵌套列表
database = [
    ['albert', '1234'],
    ['dilbert', '4242'],
    ['smith', '7524'],
    ['jones', '9843']
]

username = input("User name: ")
pin = input("PIN code: ")

# 判断子列表是否是列表的成员
if [username, pin] in database:
    print('Access granted.')
else:
    print('Permission denied.')