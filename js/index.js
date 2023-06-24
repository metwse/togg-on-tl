const w = window, d = document
var canvas, ctx

var scale, size


onresize = () => {
    ctx.resetTransform()
    scale = Math.min(canvas.offsetWidth, canvas.offsetHeight)
    scale = [scale / canvas.offsetWidth, scale / canvas.offsetHeight] 
    size = [1000 / scale[0], 1000 / scale[1]]

    ctx.scale(scale[0], scale[1]) 

    if (canvas.offsetHeight > canvas.offsetWidth) ctx.translate(500, 500 / scale[1])
    else ctx.translate(500 / scale[0], 500) 
}

onload = () => {
    canvas = d.getElementById("canvas")
    ctx = canvas.getContext("2d")

    onresize()
    draw()
}


function draw() {
    ctx.clearRect(size[0] / -2, size[1] / -2, size[0], size[1])

    ctx.strokeStyle = "red"
    ctx.beginPath()
    ctx.moveTo(-500, -500)
    ctx.lineTo(500, 500)
    ctx.moveTo(-500, 500)
    ctx.lineTo(500, -500)
    ctx.stroke()

    ctx.strokeStyle = "yellow"
    ctx.beginPath()
    ctx.moveTo(size[0] / 2, size[1] / 2)
    ctx.lineTo(-size[0] / 2, -size[1] / 2)
    ctx.moveTo(-size[0] / 2, size[1] / 2)
    ctx.lineTo(size[0] / 2, -size[1] / 2)
    ctx.stroke()

    requestAnimationFrame(draw)
}

