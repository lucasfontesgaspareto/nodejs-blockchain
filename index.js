const express = require('express')
const cors = require('cors')
const fetch = require('node-fetch')

const Blockchain = require('./blockchain')
const PubSub = require('./pubsub')

const app = express()

app.use(express.json())
app.use(cors('*'))

const blockchain = new Blockchain()
const pubsub = new PubSub({ blockchain })

const DEFAULT_PORT = 4000
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`

app.get('/api/blocks', (req, res) => {
  res.json(blockchain.chain)
})

app.post('/api/mine', (req, res) => {
  const { data } = req.body
  
  blockchain.addBlock({ data })
  pubsub.broadcastChain()

  return res.redirect('/api/blocks')
})

const syncChains = async () => {
  try {
    const response = await fetch(`${ROOT_NODE_ADDRESS}/api/blocks`);
    const rootChain = await response.json()
    
    console.log(`replace chain on a sync with`, rootChain)

    blockchain.replaceChain(rootChain)
  } catch (error) {
    console.log(error)
  }
}

let PEER_PORT

if (process.env.GENERATE_PEER_PORT === 'true') {
  PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000)
}

const PORT = PEER_PORT || DEFAULT_PORT

app.listen(PORT, () => {
  console.log(`Listening at http://localhost:${PORT}`)

  if (PORT !== DEFAULT_PORT) {
    syncChains()
  }
})
