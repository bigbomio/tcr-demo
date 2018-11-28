import BBTCRHelper from './../build/contracts/BBTCRHelper.json'
import BBUnOrderedTCR from './../build/contracts/BBUnOrderedTCR.json'
import BBVoting from './../build/contracts/BBVoting.json'
import BBVotingHelper from './../build/contracts/BBVotingHelper.json'
import BBExpertHash from './../build/contracts/BBExpertHash.json'
import BBOTest from './../build/contracts/BBOTest.json'





const drizzleOptions = {
  web3: {
    block: false,
    fallback: {
      type: 'ws',
      url: 'ws://127.0.0.1:8545'
    }
  },
  contracts: [
    BBTCRHelper,
    BBUnOrderedTCR,
    BBVotingHelper,
    BBVoting,
    BBExpertHash,
    BBOTest
  ],
  events: {
    BBUnOrderedTCR : ['Challenge'],
  },
  polls: {
    accounts: 1500
  },
  params:{
    fromBlock:  3417285
  }

}

export default drizzleOptions