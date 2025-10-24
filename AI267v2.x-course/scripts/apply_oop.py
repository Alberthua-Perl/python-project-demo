class Sample():
    def __init__ (self):
        print("自动调用构造函数")
        self.name = "小明"
        
test = Sample()
print(test.name)