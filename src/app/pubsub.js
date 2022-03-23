const PubNub = require('pubnub')

const credentials = {
  publishKey: 'pub-c-9989fe23-3d21-42c5-b137-9000b7412ec0',
  subscribeKey: 'sub-c-6d19edf4-9b49-11ec-bd45-1a3740267833',
  secretKey: 'sec-c-NzI0ODgwMmYtMDA5MC00MTc2LWFhMjAtMDEyYWE3MmNkMzk',
}

const CHANNELS = {
  TEST: 'TEST',
  BLOCKCHAIN: 'BLOCKCHAIN',
  TRANSACTION: 'TRANSACTION'
}

class PubSub {
  constructor({ blockchain, transactionPool, wallet }) {
    this.blockchain = blockchain
    this.transactionPool = transactionPool
    this.wallet = wallet

    this.publisher = new PubNub(credentials)
    this.subscriber = new PubNub(credentials)

    this.subscriber.subscribe({ channels: Object.values(CHANNELS) })
    this.subscriber.addListener({ message: (payload) => this.handleMessage(payload) })
  }

  publish({ channel, message }) {
    this.subscriber.unsubscribeAll()

    this.publisher.publish({ channel, message }, () => {
      this.subscriber.subscribe({ channels: Object.values(CHANNELS) })
    })
  }

  broadcastChain() {
    this.publish({
      channel: CHANNELS.BLOCKCHAIN,
      message: JSON.stringify(this.blockchain.chain)
    })
  }

  broadcastTransaction(transactionMap) {
    this.publish({
      channel: CHANNELS.TRANSACTION,
      message: JSON.stringify(transactionMap)
    })
  }

  handleMessage({ channel, message }) {
    console.log(`Message received. Channel: ${channel}. Message: ${message}`)

    const parsedMessage = JSON.parse(message)

    switch(channel) {
      case CHANNELS.BLOCKCHAIN:
        this.blockchain.replaceChain(parsedMessage)
        break;
      case CHANNELS.TRANSACTION:
        if (!this.transactionPool.existingTransaction({
          inputAddress: this.wallet.publicKey
        })) {
          this.transactionPool.setTransaction(parsedMessage)
        }
        break;
      default:
        return;
    }
  }
}

module.exports = PubSub
