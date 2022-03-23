const express = require('express')
const cors = require('cors')
const fetch = require('node-fetch')

const Blockchain = require('./blockchain')
const PubSub = require('./app/pubsub')
const TransactionPool = require('./wallet/transaction-pool')
const Wallet = require('./wallet')

const app = express()

app.use(express.json())
app.use(cors('*'))

const blockchain = new Blockchain()
const transactionPool = new TransactionPool()
const wallet = new Wallet()

const pubsub = new PubSub({ blockchain, transactionPool, wallet })

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

app.post('/api/transact', (req, res) => {
  const { amount, recipient } = req.body

  let transaction = transactionPool.existingTransaction({
    inputAddress: wallet.publicKey
  });

  try {
    if (transaction) {
      transaction.update({
        senderWallet: wallet,
        recipient,
        amount
      })
    } else {
      transaction = wallet.createTransaction({ recipient, amount })
    }
  } catch (error) {
    return res.status(400).json({
      type: 'error',
      message: error.message
    })
  }

  transactionPool.setTransaction(transaction)

  pubsub.broadcastTransaction(transaction)

  res.json({ type: 'success', transaction })
})

app.get('/api/transaction-pool-map', (req, res) => {
  res.json(transactionPool.transactionMap)
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

const syncTransactions = async () => {
  try {
    const response = await fetch(`${ROOT_NODE_ADDRESS}/api/transaction-pool-map`);
    const rootTransaction = await response.json()
    
    console.log(`replace transaction pool map on a sync with`, rootTransaction)

    transactionPool.setMap(rootTransaction)
  } catch (error) {
    console.log(error)
  }
}

const syncWithRootState = async () => {
  await syncChains()
  await syncTransactions()
}

let PEER_PORT

if (process.env.GENERATE_PEER_PORT === 'true') {
  PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000)
}

const PORT = PEER_PORT || DEFAULT_PORT

app.listen(PORT, () => {
  console.log(`Listening at http://localhost:${PORT}`)

  if (PORT !== DEFAULT_PORT) {
    syncWithRootState()
  }
})
