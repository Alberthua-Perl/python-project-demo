'''
PyTorch 实现 MNIST 手写数字识别
'''
import torch
import torch.nn as nn
from torch.autograd import Variable
import torch.utils.data as Data
import torchvision

'''
hyper prameters（超参数）
'''
EPOCH=1
BATCH_SIZE=50
LR=0.001
DOWNLOAD_MNIST=False

train_data = torchvision.datasets.MNIST(
    root='./mnist',
    train=True,
    transform=torchvision.transforms.ToTensor(),    #将下载的文件转换成 pytorch 认识的 tensor 类型，且将图片的数值大小从（0-255）归一化到（0-1）。
    download=DOWNLOAD_MNIST
)
train_loader=Data.DataLoader(dataset=train_data, batch_size=BATCH_SIZE, shuffle=True)

test_data=torchvision.datasets.MNIST(
    root='./mnist',
    train=False,
)
with torch.no_grad():
    test_x=Variable(torch.unsqueeze(test_data.data, dim=1)).type(torch.FloatTensor)[:2000]/255   #只取前两千个数据吧，差不多已经够用了，然后将其归一化。
    test_y=test_data.targets[:2000]

'''
开始建立 CNN 网络
'''
class CNN(nn.Module):
    def __init__(self):
        super(CNN,self).__init__()
        '''
        一般来说，卷积网络包括以下内容：
        1.卷积层
        2.神经网络
        3.池化层
        '''
        self.conv1=nn.Sequential(
            nn.Conv2d(              #--> (1,28,28)
                in_channels=1,      #传入的图片是几层的，灰色为1层，RGB为三层
                out_channels=16,    #输出的图片是几层
                kernel_size=5,      #代表扫描的区域点为5*5
                stride=1,           #就是每隔多少步跳一下
                padding=2,          #边框补全，其计算公式=（kernel_size-1）/2=(5-1)/2=2
            ),    # 2d代表二维卷积           --> (16,28,28)
            nn.ReLU(),              #非线性激活层
            nn.MaxPool2d(kernel_size=2),    #设定这里的扫描区域为2*2，且取出该2*2中的最大值          --> (16,14,14)
        )

        self.conv2=nn.Sequential(
            nn.Conv2d(              #       --> (16,14,14)
                in_channels=16,     #这里的输入是上层的输出为16层
                out_channels=32,    #在这里我们需要将其输出为32层
                kernel_size=5,      #代表扫描的区域点为5*5
                stride=1,           #就是每隔多少步跳一下
                padding=2,          #边框补全，其计算公式=（kernel_size-1）/2=(5-1)/2=
            ),                      #   --> (32,14,14)
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2),    #设定这里的扫描区域为2*2，且取出该2*2中的最大值     --> (32,7,7)，这里是三维数据
        )

        self.out=nn.Linear(32*7*7,10)       #注意一下这里的数据是二维的数据

    def forward(self,x):
        x=self.conv1(x)
        x=self.conv2(x)     #（batch,32,7,7）
        #然后接下来进行一下扩展展平的操作，将三维数据转为二维的数据
        x=x.view(x.size(0),-1)    #(batch ,32 * 7 * 7)
        output=self.out(x)
        return output
        
cnn=CNN()
# print(cnn)

# 添加优化方法
optimizer=torch.optim.Adam(cnn.parameters(),lr=LR)
# 指定损失函数使用交叉信息熵
loss_fn=nn.CrossEntropyLoss()

'''
训练模型
'''
step=0
for epoch in range(EPOCH):
    #加载训练数据
    for step,data in enumerate(train_loader):
        x,y=data
        #分别得到训练数据的x和y的取值
        b_x=Variable(x)
        b_y=Variable(y)

        output=cnn(b_x)         #调用模型预测
        loss=loss_fn(output,b_y)#计算损失值
        optimizer.zero_grad()   #每一次循环之前，将梯度清零
        loss.backward()         #反向传播
        optimizer.step()        #梯度下降

        #每执行50次，输出一下当前epoch、loss、accuracy
        if (step%50==0):
            #计算一下模型预测正确率
            test_output=cnn(test_x)
            y_pred=torch.max(test_output,1)[1].data.squeeze()
            accuracy=sum(y_pred==test_y).item()/test_y.size(0)

            print('now epoch :  ', epoch, '   |  loss : %.4f ' % loss.item(), '     |   accuracy :   ' , accuracy)

'''
打印十个测试集的结果
'''
test_output=cnn(test_x[:10])
y_pred=torch.max(test_output,1)[1].data.squeeze()       #选取最大可能的数值所在的位置
print(y_pred.tolist(),'predecton Result')
print(test_y[:10].tolist(),'Real Result')