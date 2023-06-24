const w = window, d = document
var canvas, ctx

var scale, size, pos, polarit

var cache = {}

var road
var t0



onresize = () => {
    if (scale) {
        if (polarit) pos[1] -= 500 / scale[1]
        else pos[1] -= 500
    } else pos = [0, 0]
    
    scale = Math.min(canvas.offsetWidth, canvas.offsetHeight)
    scale = [scale / canvas.offsetWidth, scale / canvas.offsetHeight] 
    size = [1000 / scale[0], 1000 / scale[1]]

    polarit = canvas.offsetHeight > canvas.offsetWidth

    if (polarit) pos[1] += 500 / scale[1]
    else pos[1] += 500
}

onload = async () => {
    canvas = d.getElementById('canvas')
    ctx = canvas.getContext('2d')

    onresize()

    road = await fetchCurrency('usd')
    t0 = performance.now()
    pos[0] = -200
    update(t0)
}



async function fetchCurrency(name) {
    if (cache[name]) return cache[name]
    let data = (await fetch('/currencies/usd').then(r => r.text())).split('\n').map(v => v.split(',')).reverse()
    cache[name] = data
    return data
}

function draw() {
    ctx.resetTransform()
    ctx.scale(scale[0], scale[1]) 
    ctx.translate(pos[0], pos[1]) 
    ctx.clearRect(-pos[0], -pos[1], size[0], size[1])
    pos[0] += 10


    const draw = {
        start: false,
        end: false,
        offset: ~~(pos[0] / 10)
    }
    var max = 0


    for (let i = draw.offset; i <= Math.ceil(size[0] / 10) + draw.offset + 1; i ++) {
        let r = road[i]
        if (r?.[1]) {
            if (draw.start == false) draw.start = i
            max = Math.max(+r[1], max)
        } else if (draw.start) { draw.end = i - 1; break }
    } 
    if (!draw.end) draw.end = Math.ceil(size[0] / 10) + draw.offset + 1
    max ++
    console.log(draw)


    //{{{ draw lines 
    ctx.lineWidth = 2
    ctx.strokeStyle = '#363A3D'
    ctx.fillStyle = '#9AA0A6'
    ctx.font = '16px monospace'

    for (let i = 1; i < max; i ++) {
        let y = 500 - i * 50
        ctx.beginPath()
        ctx.moveTo(-pos[0], y)
        ctx.lineTo(-pos[0] + size[0] - 30, y)
        ctx.stroke()
        ctx.fillText(i, -pos[0] + size[0] - 20, y + 5)
    }
    //}}}


    //{{ draw graph
    ctx.lineWidth = 4
    ctx.strokeStyle = '#AAFFC4'
    ctx.lineCap = 'round'

    if (draw.start && draw.end)
        for (let line = 0; line <= 1; line ++) {
            ctx.beginPath()
            !line && ctx.lineTo(-pos[0] + (draw.start - draw.offset) * 10 - (pos[0] % 10), 500)
            for (let i = draw.start; i <= draw.end; i++) {
                let y = 500 - road[i][1] * 50
                ctx.lineTo(-pos[0] + (i - draw.offset) * 10 - (pos[0] % 10), y)
            }
            !line && ctx.lineTo(-pos[0] + (draw.end - draw.offset) * 10 - (pos[0] % 10), 500)
            line && ctx.stroke()

            if (!line) {
                let gradient = ctx.createLinearGradient(0, 500 - max * 50, 0, 500);
                gradient.addColorStop(0, '#33423A');
                gradient.addColorStop(1, '#33423A00');
                ctx.fillStyle = gradient
                ctx.fill()
            }
        }
    //}}
}

var dt
function update(t) {
    dt = t - t0
    t0 = performance.now()

    draw()
    requestAnimationFrame(update)
}


class Vector {
    constructor(x, y, m) {
        this.x = x, this.y = y, this.m = m
    }
}
