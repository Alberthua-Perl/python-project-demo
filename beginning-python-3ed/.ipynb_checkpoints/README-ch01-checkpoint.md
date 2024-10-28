# 第 1 章  快速上手：基础知识

-----

## 变量、语句

- Python 交互提示符中可直接提供十六进制、八进制与二进制数，返回十进制的值。
- Python 中的变量名称称为标识符
- 区分表达式与语句：表达式是一些东西，语句做一些事情。
- 取模运算（求余数）的示例：

  ```python
  >>> time = 40
  >>> if time % 10 == 0:
  ...   print("Now full ten minutes!")
  ... else:
  ...   print("Not full ten minutes!")
  ... 
  Now full ten minutes!
  
  >>> time = 43
  >>> if time % 10 == 0:
  ...   print("Now full ten minutes!")
  ... else:
  ...   print("Not full ten minutes!")
  ... 
  Not full ten minutes!
  # 以上两个示例用于判断当前的分钟是否为整十分，如果为整十，那么可被 10 整除。
  ```

-----

## 获取用户输入、函数与模块

- 内置函数：  
  - help([object])：提供交互式帮助
  - print(object, ...)：将提供的实参打印出来，转译特殊字符，并用空格分隔，如 print("Hello world!")。  
  - input(prompt)：给定参数（实参），以标准输出打印，阻塞等待用户的输入，返回用户输入的字符串。    

    ```python
    >>> input("Type one number: ")
    Type one number: 35
    '35'
    ```
  
  - pow(m, n)：返回计算 m 的 n 次方

- 类型转换函数：
  - int()：转换浮点数为整形数（向下取整）  
  - round(number[, ndigits])：将浮点数取整到最接近的整形数，四舍五入为指定的精度，正好为 5 时舍入到偶数，如 `round(3.853234245435, 2)` 返回 3.85。
  - abs(number)：返回指定数的绝对值  
  - math.floor(number)：使用 math 模块中的 floor 函数将浮点数向下取整，如 `math.floor(34.5)` 返回 34。  
  - math.ceil(number)：使用 math 模块中的 ceil 函数将浮点数向上取整，如 `ath.ceil(36.3)` 返回 37。    

    ```python
    import math
    math.floor(34.5)
    # 方法1：返回 34
    
    from math import floor
    floor(34.5)
    # 方法2：返回 34
    ```

    以上两种语法格式相互等同，第2种方法 `from module import function` 避免了每次调用 math 模块时的冗余，不指定模块前缀。
    由于 Python 中处理复数的模块也用 sqrt 函数，因此，直接使用 from cmath import sqrt 方式可能和使用 from math import sqrt 中的 sqrt 函数冲突。因此，依然建议直接使用 import。
    > 注意：
    > 1. 浮点数在 int、round 等函数中总是向下取整
    > 2. Java 是完全面向对象的语言，函数在 Java 中以方法的形式使用，因此，在 import 导入包中文件后，定义声明新对象或使用 this 引用方法。
    > 3. Python 是面向过程且支持面向对象的语言，具有内置函数库，因此，在使用函数时可直接调用函数或使用 `module.function` 调用外部模块中的函数。
  
  - math.sqrt(number)：返回数的平方根（不可用于负数）
  - cmath.sqrt(number)：返回数的平方根（可用于负数）
- float(object) 类：将字符串或数字转换为浮点数。

-----

## 字符串

- Python3 中所有字符串都是 Unicode 字符串
- 反斜杠转译说明：使用 `\` 转译单引号表示其本身  
  
  ```python
  >>> Let's say "Hello world!"
    File "<stdin>", line 1
      Let's say "Hello world!"
                           ^
  SyntaxError: EOL while scanning string literal
  >>> 'Let's say "Hello world!"'
    File "<stdin>", line 1
      'Let's say "Hello world!"'
         ^
  SyntaxError: invalid syntax
  >>> 'Let\'s say "Hello world!"'
  'Let\'s say "Hello world!"'
  ```

- 常规字符串也可横跨多行。只要在行尾加上反斜杠，反斜杠和换行符将被转义，即被忽略。
- 字符串合并操作符：`+`  
  
  ```python
  >>> x = 'Hello'
  >>> y = 'world!'
  >>> x + ' ' + y
  'Hello world!'
  ```

- Python 打印所有的字符串时，都用引号将其括起。这是因为 Python 打印值时，保留其在代码中的样子，而不是希望用户看到的样子。
- 直接使用交互式提示符打印字符串与 print 函数打印存在差异，前者返回值使用引号，而后者不使用引号并解释特殊字符。
- 字符串相关函数与类：
  - str(object) 类：将指定的值转换为字符串。用于转换 bytes 时，可指定编码和错误处理方式。
  - repr(object) 函数：返回指定值的字符串表示

    ```python
    >>> print(str("Hello,\nworld!"))
    Hello,
    world!
    >>> print(repr("Hello,\nworld!"))
    'Hello,\nworld!'
    ```

- 三引号（单引号与双引号均可）让解释器能够识别表示字符串开始和结束位置的引号，因此字符串本身可包含单引号和双引号，无需使用反斜杠进行转义。
- 保留特殊字符本身：
  
  ```python
  >>> print("C:\Program Files\fnord\foo\bar\baz\frozz\bozz")
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
