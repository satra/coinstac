- .mov to .gif: https://gist.github.com/dergachev/4627207
- cmd: `ffmpeg -i demo-capture.mov -s 600x526 -pix_fmt rgb24 -r 5 -f gif - | gifsicle --optimize=3 --delay=10 > demo-capture.gif`