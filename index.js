import imageSrc from 'url:./tim-hortons-map.jpeg';
import items from './items.js';

window.items = items

const info = document.getElementById('info')
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

const editButton = document.getElementById('toggle-edit')

const backgroundImage = new Image()

function drawMap () {
  backgroundImage.onload = () => {
    info.style.display = 'none'
    draw()
  }
  backgroundImage.src = imageSrc
}

drawMap()


const drawFns = {
  circle: function drawCircle (ctx, x, y, color) {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, 40, 0, 2 * Math.PI)
    ctx.fill()
  },
  square: function drawSquare (ctx, x, y, color) {
    ctx.fillStyle = color
    ctx.fillRect(x - 40, y - 40, 80, 80)
  },
  text: function drawText (ctx, x, y, text) {
    ctx.fillStyle = 'black'
    ctx.font = '40px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, x, y)
  },
  x: function drawX (ctx, x, y) {
    ctx.strokeStyle = 'red'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(x - 25, y - 25)
    ctx.lineTo(x + 25, y + 25)
    ctx.moveTo(x + 25, y - 25)
    ctx.lineTo(x - 25, y + 25)
    ctx.stroke()
  }
}

function drawItems () {
  for (const itemId in items) {
    const item = items[itemId]
    const [x, y] = item.pos

    drawFns[item.type](ctx, x, y, item.color)
    drawFns.text(ctx, x, y, itemId)

    if (item.purchased) {
      drawFns.x(ctx, x, y)
    }
  }
}

function draw () {
  if (!backgroundImage.complete) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height)
  drawItems()
}

async function run () {
  console.log('Fetching purchases...')

  const req = await fetch('https://script.google.com/macros/s/AKfycby2pT9VNGn14PXEtgagIgxRND0frnvfRlDiIXf5GsmalNTZaf6y4Fgoz5JAWRHGpEkTxA/exec')
  const purchaseIds = await req.json()

  console.log('purchases', purchaseIds)

  for (const purchaseId in purchaseIds) {
    if (items[purchaseId]) {
      items[purchaseId].purchased = true
    }
  }

  drawMap()
}

// run()

// Edit mode state and handlers.
let editMode = false
let draggingItemId = null
let dragOffset = [0, 0]

function getCanvasCoords (event) {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const x = (event.clientX - rect.left) * scaleX
  const y = (event.clientY - rect.top) * scaleY
  return [x, y]
}

function findItemAtPosition (x, y) {
  for (const itemId in items) {
    const item = items[itemId]
    if (item.type === 'circle') {
      const [itemX, itemY] = item.pos
      const distance = Math.hypot(x - itemX, y - itemY)
      if (distance <= 40) {
        return itemId
      }
    }
  }
  return null
}

function handlePointerDown (event) {
  if (!editMode) return
  if (event.button !== 0) return
  const [x, y] = getCanvasCoords(event)
  const itemId = findItemAtPosition(x, y)
  if (!itemId) return
  draggingItemId = itemId
  const [itemX, itemY] = items[itemId].pos
  dragOffset = [x - itemX, y - itemY]
  event.preventDefault()
}

function handlePointerMove (event) {
  if (!draggingItemId) return
  const [x, y] = getCanvasCoords(event)
  const item = items[draggingItemId]
  item.pos = [x - dragOffset[0], y - dragOffset[1]]
  draw()
}

function handlePointerUp () {
  draggingItemId = null
}

// Wire up mouse handlers for edit interactions.
canvas.addEventListener('mousedown', handlePointerDown)
window.addEventListener('mousemove', handlePointerMove)
window.addEventListener('mouseup', handlePointerUp)

editButton.addEventListener('click', () => {
  editMode = !editMode
  editButton.textContent = editMode ? 'Disable Edit Mode' : 'Enable Edit Mode'
  handlePointerUp()
})
