import imageSrc from 'url:./tim-hortons-map.jpeg';
import items from './items.js';

window.items = items

const info = document.getElementById('info')
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

const backgroundImage = new Image()

function drawMap () {
  backgroundImage.onload = () => {
    draw()
  }
  backgroundImage.src = imageSrc
}

const ITEM_SIZE = 30
const WORLD_POSITION = [0, 0]
const WORLD_SCALE = 1.2
const ITEM_OUTLINE_WIDTH = Math.max(1, ITEM_SIZE * 0.125)

const drawFns = {
  circle: function drawCircle (ctx, x, y, color) {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, ITEM_SIZE, 0, 2 * Math.PI)
    ctx.fill()
    ctx.lineWidth = ITEM_OUTLINE_WIDTH
    ctx.strokeStyle = 'red'
    ctx.stroke()
  },
  square: function drawSquare (ctx, x, y, color) {
    ctx.fillStyle = color
    ctx.fillRect(x - ITEM_SIZE, y - ITEM_SIZE, ITEM_SIZE * 2, ITEM_SIZE * 2)
    ctx.lineWidth = ITEM_OUTLINE_WIDTH
    ctx.strokeStyle = 'blue'
    ctx.strokeRect(x - ITEM_SIZE, y - ITEM_SIZE, ITEM_SIZE * 2, ITEM_SIZE * 2)
  },
  text: function drawText (ctx, x, y, text) {
    ctx.fillStyle = 'black'
    ctx.font = `${ITEM_SIZE}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, x, y)
  },
  x: function drawX (ctx, x, y) {
    ctx.strokeStyle = 'red'
    ctx.lineWidth = Math.max(1, ITEM_SIZE * 0.125)
    const offset = ITEM_SIZE * 0.625
    ctx.beginPath()
    ctx.moveTo(x - offset, y - offset)
    ctx.lineTo(x + offset, y + offset)
    ctx.moveTo(x + offset, y - offset)
    ctx.lineTo(x - offset, y + offset)
    ctx.stroke()
  }
}

function getWorldPos (x, y) {
  const [wX, wY] = WORLD_POSITION
  const worldX = wX + x * WORLD_SCALE
  const worldY = wY + y * WORLD_SCALE
  return [worldX, worldY]
}

function getLocalPos (x, y) {
  const [wX, wY] = WORLD_POSITION
  const localX = (x - wX) / WORLD_SCALE
  const localY = (y - wY) / WORLD_SCALE
  return [localX, localY]
}

function drawItems () {
  for (const itemId in items) {
    const item = items[itemId]
    const [x, y] = getWorldPos(...item.pos)

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

async function fetchPurchases () {
  console.log('Fetching purchases...')

  const req = await fetch('https://script.google.com/macros/s/AKfycby2pT9VNGn14PXEtgagIgxRND0frnvfRlDiIXf5GsmalNTZaf6y4Fgoz5JAWRHGpEkTxA/exec')
  const purchaseIds = await req.json()

  console.log('purchases', purchaseIds)

  for (const purchaseId of purchaseIds) {
    if (items[purchaseId]) {
      items[purchaseId].purchased = true
    }
  }

  drawMap()
  info.style.display = 'none'
}

drawMap()
// fetchPurchases()

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
    const [itemX, itemY] = getWorldPos(...item.pos)
    const distance = Math.hypot(x - itemX, y - itemY)
    if (distance <= ITEM_SIZE) {
      return itemId
    }
  }
  return null
}

function handlePointerDown (event) {
  if (!editMode) return
  if (event.button !== 0) return
  const [canvasX, canvasY] = getCanvasCoords(event)
  const itemId = findItemAtPosition(canvasX, canvasY)
  if (!itemId) return
  draggingItemId = itemId
  const [localX, localY] = getLocalPos(canvasX, canvasY)
  const [itemX, itemY] = items[itemId].pos
  dragOffset = [localX - itemX, localY - itemY]
  event.preventDefault()
}

function handlePointerMove (event) {
  if (!draggingItemId) return
  const [canvasX, canvasY] = getCanvasCoords(event)
  const [localX, localY] = getLocalPos(canvasX, canvasY)
  const item = items[draggingItemId]
  item.pos = [localX - dragOffset[0], localY - dragOffset[1]]
  draw()
}

function handlePointerUp () {
  draggingItemId = null
}

// Wire up mouse handlers for edit interactions.
const editButton = document.getElementById('toggle-edit')
if (editButton) {
  canvas.addEventListener('mousedown', handlePointerDown)
  window.addEventListener('mousemove', handlePointerMove)
  window.addEventListener('mouseup', handlePointerUp)

  editButton.addEventListener('click', () => {
    editMode = !editMode
    editButton.textContent = editMode ? 'Disable Edit Mode' : 'Enable Edit Mode'
    handlePointerUp()
  })
}
