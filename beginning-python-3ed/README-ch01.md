
  
  ```python
  >>> 
  C:\Program Files
                  nord
                      oaaz
                          rozozz
  # print 函数转译特殊字符
  
  >>> print(repr("C:\Program Files\fnord\foo\bar\baz\frozz\bozz"))
  'C:\\Program Files\x0cnord\x0coo\x08ar\x08az\x0crozz\x08ozz'
  >>> print(str("C:\Program Files\fnord\foo\bar\baz\frozz\bozz"))
  C:\Program Files
                  nord
                      oaaz
                          rozozz
  # str 转译特殊字符  
  
  ### 字符串前缀 r
  >>> print(r"C:\Program Files\fnord\foo\bar\baz\frozz\bozz")
  C:\Program Files\fnord\foo\bar\baz\frozz\bozz
  # 字符串前缀 r 用于表示原始字符串（字符串本身）
  
  >>> print(r'Let\'s go!')
  Let\'s go!
  # 特例：字符串前缀 r 单引号表示本身依然需要反斜杠
  
  >>> print(r'Let\'s go!\')
    File "<stdin>", line 1
      print(r'Let\'s go!\')
                        ^
  SyntaxError: EOL while scanning string literal
  # 报错：字符串前缀 r 的末尾不能使用反斜杠。如果使用反斜杠对该反斜杠转译，那么输出返回中将出现两个反斜杠（如下所示）。  
  >>> print(r'Let\'s go!\\')
  Let\'s go!\\
  
  >>> print(r'C:\Programme Files\foo\bar' '\\')
  C:\Programme Files\foo\bar\
  # 单独使用反斜杠对反斜杠转译可保留上述路径中的反斜杠输出（Windows 中的路径输出很有用）
  ```

- Unicode 字符的说明：
  - 实现：数字 -> 码点（code point）-> Unicode 字符
  - Unicode、bytes 与 bytearray 暂时跳过
