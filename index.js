import imageSrc from 'url:./tim-hortons-map.jpeg';

const info = document.getElementById('info')
const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

const items = {
  1: {
    pos: [40, 40],
    type: 'circle',
    color: 'white',
    purchased: true
  }
}

function drawItems () {
  for (const itemId in items) {
    const item = items[itemId]
    const [x, y] = item.pos

    ctx.fillStyle = item.color

    if (item.type === 'circle') {
      ctx.beginPath()
      ctx.arc(x, y, 40, 0, 2 * Math.PI)
      ctx.fill()
    }

    // write id inside the item
    ctx.fillStyle = 'black'
    ctx.font = '40px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(itemId, x, y)

    if (item.purchased) {
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
}

function render () {
  const img = new Image()
  img.onload = function () {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    drawItems()
  }
  img.src = imageSrc
  info.style.display = 'none'
}

render()

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

  render()

}

// run()

