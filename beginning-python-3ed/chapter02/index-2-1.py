#!/usr/bin/env python

# 将以数指定年、月、日的日期打印出来
months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
]

# 一个列表，其中包含数 1～31 对应的结尾
endings = ['st', 'nd', 'rd'] + 7 * ['th'] \
        + ['st', 'nd', 'rd'] + 7 * ['th'] \
        + ['st', 'nd', 'rd'] + 7 * ['th'] \
        + ['st']

year  = input('Year: ')
month = input('Month (1-12): ')
day   = input('Day (1-31): ')

# input 函数返回字符串需转换为整型数
month_number = int(month)
day_number = int(day)

# 将表示月和日的数减1，这样才能得到正确的索引
month_name = months[month_number-1]
ordinal = day + endings[day_number-1]

print(month_name + ' ' + ordinal + ', ' + year)

