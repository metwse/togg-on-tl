const w = window, d = document
var canvas, ctx

var scale, size, pos, polarit

var cache = {}

var road, t0
var wheels

var graph, max

var car = {
    gas: false, break: false,
    rotation: 0
}

const PI2 = Math.PI * 2
const PI = Math.PI

const images = {
    wheel: 0, body: 0
}


//{{{ events
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

    images.body = d.createElement('img')
    images.body.src = '/images/body.svg'
    images.wheel = d.createElement('img')
    images.wheel.src = '/images/wheel.svg'

    canvas.addEventListener('touchstart', ({ touches: [{ pageX }] }) => {
        if (pageX > window.innerWidth / 2) car.gas = true
        else car.break = true
    })
    canvas.addEventListener('touchend', () => { car.gas = car.break = false })
    d.addEventListener('contextmenu', event => event.preventDefault())


    onresize()

    road = await fetchCurrency('usd')
    t0 = performance.now()
    restart()
    update(t0)
}

onkeydown = e => {
    switch (e.key.toLowerCase()) {
        case 'w':
        case 'd': 
        case 'arrowup':
        case 'arrowright': 
            car.gas = true; break
        case 's':
        case 'a': 
        case 'arrowdown':
        case 'arrowleft': 
            car.break = true; break
    }
}
onkeyup = e => {
    car.break = car.gas = false
    
}
//}}}


async function fetchCurrency(name) {
    if (cache[name]) return cache[name]
    let data = (await fetch('/currencies/usd').then(r => r.text())).split('\n').map(v => v.split(',')).reverse()
    cache[name] = data
    return data
}


function restart() {
    wheels = [new Wheel(300, -500, 10, 20), new Wheel(500, -500, 10, 20)]
    pos = [-200, 500]
}


function draw() {
    ctx.resetTransform()
    ctx.scale(scale[0], scale[1]) 
    ctx.translate(pos[0], pos[1]) 
    ctx.clearRect(-pos[0], -pos[1], size[0], size[1])


    //{{{ draw lines 
    ctx.lineWidth = 2
    ctx.strokeStyle = '#363A3D'
    ctx.fillstyle = '#9aa0a6'
    ctx.textalign = 'left'
    ctx.font = '16px monospace'

    for (let i = 1; i <= max + 1; i ++) {
        let y = 500 - i * 50
        ctx.beginPath()
        ctx.moveTo(-pos[0], y)
        ctx.lineTo(-pos[0] + size[0] - 30, y)
        ctx.stroke()
    }
    //}}}


    //{{{ draw graph
    ctx.lineWidth = 4
    ctx.strokeStyle = '#AAFFC4'
    ctx.lineCap = 'round'
    ctx.textAlign = 'center'

    if (graph.start && graph.end)
        for (let line = 0; line <= 1; line ++) {
            ctx.beginPath()
            !line && ctx.lineTo(-pos[0] + (graph.start - graph.offset) * 10 - (pos[0] % 10), 500)
            for (let i = graph.start; i <= graph.end; i++) {
                let y = 500 - road[i][1] * 50
                ctx.lineTo(-pos[0] + (i - graph.offset) * 10 - (pos[0] % 10), y)
                ctx.fillStyle = '#9AA0A6'
                line && i % 20 == 0 && ctx.fillText(road[i][0], -pos[0] + (i - graph.offset) * 10 - (pos[0] % 10), 750 - max * 50)
            }
            !line && ctx.lineTo(-pos[0] + (graph.end - graph.offset) * 10 - (pos[0] % 10), 500)
            line && ctx.stroke()

            if (!line) {
                let gradient = ctx.createLinearGradient(0, 500 - max * 50, 0, 500);
                gradient.addColorStop(0, '#33423A');
                gradient.addColorStop(1, '#33423A00');
                ctx.fillStyle = gradient
                ctx.fill()
            }
            ctx.closePath()
        }
    //}}}


    //{{{ draw numbers
    ctx.fillStyle = '#202124'
    ctx.fillRect(-pos[0] + size[0] - 30, 440 - max * 50, 30, max * 50 + 50)

    ctx.fillStyle = '#9AA0A6'
    ctx.textAlign = 'left'
    ctx.font = '16px monospace'
    for (let i = 1; i <= max + 1; i ++) 
        ctx.fillText(i, -pos[0] + size[0] - 20, 505 - i * 50)
    //}}}


    //{{{ draw car
    wheels.forEach(v => v.draw())
    let dx = (wheels[0].x + wheels[1].x) / 2 - pos[0], dy = (wheels[0].y + wheels[1].y) / 2 + pos[1]
    ctx.translate(dx, dy)
    ctx.rotate(car.rotation)
    ctx.drawImage(images.body, -125, -70, 247, 90)
    ctx.rotate(-car.rotation)
    ctx.translate(-dx, -dy)
    //}}}
}


var dt
function update(t) {
    dt = (t - t0) / 1000
    t0 = performance.now()
    if (dt > 0.3) return requestAnimationFrame(update)
    else requestAnimationFrame(update)


    graph = {
        start: false, end: false,
        offset: ~~(pos[0] / 10)
    }
    max = 0

    let Gsin = Math.sin(car.rotation)
    wheels.forEach(wheel => {
        wheel.ground = []
        wheel.F.temp.push([wheel.m * Gsin, 0])
    })
    car.rotation = Math.atan2(wheels[0].y - wheels[1].y, wheels[0].x - wheels[1].x) + PI
    if (car.gas) wheels.forEach(v => { v.F.temp.push([100, 0]) })
    if (car.break) wheels.forEach(v => { v.F.temp.push([-50, 0]) })

    

    for (let i = graph.offset - 5; i <= Math.ceil(size[0] / 10) + graph.offset + 4; i ++) {
        let r = road[i]
        if (r?.[1]) {
            if (graph.start == false) graph.start = i
            max = Math.max(+r[1], max)
            let x = -pos[0] + (i - graph.offset) * 10 - (pos[0] % 10)
            let y = 500 - road[i][1] * 50
            for (let wheel of wheels)
                if (Math.abs(x - (wheel.x - pos[0])) <= 20)
                    wheel.ground.push([x, y])
        } else if (graph.start) { graph.end = i - 1; break }
    } 
    if (!graph.end) graph.end = Math.ceil(size[0] / 10) + graph.offset + 4


    draw()

    let a = (wheels[0].x - 300) / 20
    wheels[0].x -= a
    wheels[1].x -= a
    pos[0] += a
    a = (size[1] / 2 - 500 + max * 50 - pos[1]) / 10
    wheels[0].y -= a
    wheels[1].y -= a
    pos[1] += a

    let l = distance(wheels[0], wheels[1]) - 160
    for (let i = 0; i <= 1; i ++) {
        wheels[i].x += Math.cos(car.rotation) * l / 4 * (i ? -1 : 1)
        wheels[i].y += Math.sin(car.rotation) * l / 4 * (i ? -1 : 1)
    }

    wheels.forEach(v => v.update(dt))
}


class Wheel {
    constructor(x, y, m, r) {
        this.x = x, this.y = y
        this.m = m, this.r = r
        this.v = [0, 0]
        this.F = []
        this.F.temp = []
        this.ground = []
        this.rotation = 0
    }
    
    update(dt) {
        let Fnet = [0, this.m * 20], F = this.F.concat(this.F.temp)
        for (let i = 0; i < F.length; i ++) { Fnet[0] += F[i][0], Fnet[1] += F[i][1] }

        this.a = [Fnet[0] / this.m, Fnet[1] / this.m]
        let dx = this.a[0] * dt ** 2 / 2 + this.v[0] * dt, dy = this.a[1] * dt ** 2 / 2 + this.v[1] * dt
        this.x += dx, this.y += dy

        if (this.touchingGround) this.v[0] += this.a[0]
        this.v[1] += this.a[1]

        if (!Fnet?.[0]) this.v[0] *= .95
        else if (Math.sign(this.v[0]) != Math.sign(this.a[0])) this.v[0] *= .9
        else this.v[0] *= .99

        let i = 0
        while (this.touchingGround && i < 20) { this.y -= 1; i ++ }
        if (i > 10) {
            this.v[0] *= .8, this.v[1] = 0
            this.x -= dx / 2
        }
        
        this.rotation += dx / this.r
        this.F.temp = []
    }

    get touchingGround() {
        let y
        for (let i = 0; i < this.ground.length - 1; i ++) {
            if (pointLineDistance([this.x - pos[0], this.y + pos[1]], [this.ground[i], this.ground[i + 1]]) <= this.r) {
                y = this.y + pos[1] + this.r
                if (y < this.ground[i][1] && y > this.ground[i + 1][1]) return true
                if (y > this.ground[i][1] && y < this.ground[i + 1][1]) return true
                if (y > this.ground[i][1] && y > this.ground[i + 1][1]) return true
            }
        }
        return false
    }

    draw() {
        let dx = this.x - pos[0], dy = this.y + pos[1] 
        ctx.translate(dx, dy)
        ctx.rotate(this.rotation)
        ctx.drawImage(images.wheel, -20, -20, 40, 40)
        ctx.rotate(-this.rotation)
        ctx.translate(-dx, -dy)
    }

    get ['0']() { return this.x }
    get ['1']() { return this.y }
}



//{{{ math
const Mathm = {
	scalarMult(M, t) {
		return M.map(row => row.map(v => v * t))
	},
	rotation(angle) {
		return [[Math.cos(angle), Math.sin(angle)], [-Math.sin(angle), Math.cos(angle)]]
	},
	add(M, N) {
		if (M.length != N.length || M[0].length != N[0].length) return null
		return M.map((row, ri) => row.map((v, ci) => v + N[ri][ci]))
	},
	mult(M, N) {
		if (M[0].length != N.length) return null
		var matrix = []
		for (let Mrow = 0; Mrow < M.length; Mrow++) {
			matrix[Mrow] = new Array(N[0].length).fill(0)
			for (let Ncol = 0; Ncol < N[0].length; Ncol++)
				for (let Mcol = 0; Mcol < M[0].length; Mcol++)
					matrix[Mrow][Ncol] += M[Mrow][Mcol] * N[Mcol][Ncol]
		}
		return matrix
	},
	dotProduct(A, B) {
		return Math.matrix.mult([A], [[B[0]], [B[1]]]) / distance([0, 0], B)
	}
}
const intersection = ([A, B], [C, D]) => [
	((A[0] - C[0]) * (C[1] - D[1]) - (A[1] - C[1]) * (C[0] - D[0])) / ((A[0] - B[0]) * (C[1] - D[1]) - (A[1] - B[1]) * (C[0] - D[0])),
	((A[0] - C[0]) * (A[1] - B[1]) - (A[1] - C[1]) * (A[0] - B[0])) / ((A[0] - B[0]) * (C[1] - D[1]) - (A[1] - B[1]) * (C[0] - D[0]))
]

const lerp = (A, B, t) => A + (B - A) * t
const distance = (A, B) => Math.sqrt((A[0] - B[0]) ** 2 + (A[1] - B[1]) ** 2)
const pointLineDistance = (A, [[c, d], [e, f]]) => { 
    let m = (d - f) / (c - e)
    if (!isFinite(m)) return Math.abs(A[0])
    return Math.abs(m * A[0] - A[1] - m * c + d) / Math.sqrt(m ** 2 + 1)
}
//}}}
