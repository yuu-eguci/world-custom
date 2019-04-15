
import os
import re

# Cd to git's layer.
os.chdir(os.path.dirname(os.path.abspath(__file__)))

replace_dic = {
    '360x195'  : ['b1','b2','b3','b4','b5','b6','b7','b8',        ],
    '95x95'    : ['b10','b11','b12','b13','b14','b15','b16','b17',],
    '195x195'  : ['b18','b19','b20','b21','b23','b24',            ],
    '328x165'  : ['b22',                                          ],
    '1920x1280': ['bg1','bg2',                                    ],
    '1366x400' : ['bg3','bg4',                                    ],
}

for fpath in (fpath for fpath in os.listdir('.') if fpath.endswith('html')):
    with open(fpath, 'r', encoding='utf-8') as f:
        text = f.read()

    for to,frms in replace_dic.items():
        for frm in frms:
            text = text.replace(f'blog-img/{frm}.jpg', f'sample/{to}.jpg')

    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(text)
