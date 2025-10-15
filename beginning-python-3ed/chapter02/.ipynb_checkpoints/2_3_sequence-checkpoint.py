#!/usr/bin/env python
# 在位于屏幕中央且宽度合适的方框内打印一个句子

sentence = input("Sentence: ")

screen_width = 80
text_width = len(sentence)  # len 函数返回整型数
box_width = text_width + 6
left_margin = (screen_width - box_width) // 2

print()
print(' ' * left_margin + '+'  + '-' * (box_width-4) +  '+') 
print(' ' * left_margin + '| ' + ' ' * text_width    + ' |') 
print(' ' * left_margin + '| ' +       sentence      + ' |') 
print(' ' * left_margin + '| ' + ' ' * text_width    + ' |') 
print(' ' * left_margin + '+'  + '-' * (box_width-4) +  '+')
print()
