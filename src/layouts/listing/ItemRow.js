import React from 'react';
import PropTypes from 'prop-types';
import TCRUtil from '../tcrUtil/TCRUtil'
import TableCell from '@material-ui/core/TableCell';
import Button from '@material-ui/core/Button';
import Apply from '../apply/Apply'
import Challenge from '../challenge/Challenge'
import Voting from '../voting/Voting'
import TableRow from '@material-ui/core/TableRow';
import { drizzleConnect } from 'drizzle-react'
import Countdown from '../join/Countdown'

class ItemRow  extends React.Component {
  constructor(props, context) {
  	super(props, context);
  	this.state = {item: this.props.item};
  	this.contracts = context.drizzle.contracts;
  	this.web3 = context.drizzle.web3
  	this.fromBlock = context.drizzle.options.params.fromBlock

  }
  componentDidMount = async () => {
  	let ipfsHash = this.web3.utils.toAscii(this.state.item.ipfsHash)
  	let creator = this.state.item.sender
  	let itemHash = this.web3.utils.sha3(ipfsHash)
  	let data = await this.getDataIPFS(ipfsHash);
  	if(data) {
  		let stage = await this.contracts.BBTCRHelper.methods.getItemStage(this.props.listID, itemHash).call() 
	  	let isOwner = await this.contracts.BBTCRHelper.methods.isOwnerItem(this.props.listID, itemHash, this.props.accounts[0]).call();
	  	let itemStatus = await this.getItemTime(ipfsHash, stage)
	    let obj = {creator:creator,  ipfsHash:ipfsHash, name: data.fullName,
	     address:data.address, phone : data.phone, email:data.email, status:itemStatus, 
	      created: 0, itemHash : itemHash, isOwner : isOwner, stage : stage, listID: this.props.listID};
	    this.setState({item:obj})
	  }
  }
  getPassEvents = (evenName, contract, options) => {
    let ContractIntanceWeb3 = new this.web3.eth.Contract(contract.abi, contract.address);
    return ContractIntanceWeb3.getPastEvents(evenName, options , function(error, event){
    	return [];
    })
    .then(async function(events){
        return events;
    });
  }
  getItemTime = async (ipfsHash, stage) => {
  	var resObj = {
  		pollID: 0,
  		pollStatus: 0,
  		stage: 'New',
  		applicationEndDate: 0,
  		commitEndDate: 0,
  		revealEndDate: 0,
  	}
  	let now = new Date()/1000;
  	if(stage == 2){
  		
  		let r = await this.getPassEvents('Challenge', this.contracts.BBUnOrderedTCR,
  			{filter: {
  					listID:this.props.listID,
  				 	itemHash: this.web3.utils.sha3(ipfsHash)
  				 },
  			 fromBlock: this.fromBlock,
  			});
  		if(r.length > 0){
  			//get latest event logs r[r.length-1]
  			resObj.pollID = r[r.length-1].returnValues.pollID
  			if(resObj.pollID > 0){
  				let voting = await this.contracts.BBVotingHelper.methods.getPollStage(resObj.pollID).call();
  				resObj.pollStatus = voting[0]
  				resObj.commitEndDate = voting[3]
  				resObj.revealEndDate = voting[4]
  				if(resObj.commitEndDate > now){
  					resObj.stage = 'Vote - Commit'
  				}else if(resObj.revealEndDate > now){
  					resObj.stage = 'Vote - Reveal'
  				}else{
  					resObj.stage = 'Updating'
  				}
  			}
  		}
  	}else if(stage == 1) {
  		resObj.stage = 'In Application'
  		let r = await this.getPassEvents('ItemApplied', this.contracts.BBUnOrderedTCR,
  			{filter: {
  					listID:this.props.listID,
  				 	itemHash: this.web3.utils.sha3(ipfsHash)
  				 },
  			 fromBlock: this.fromBlock,
  			});
  		if(r.length > 0){
  			resObj.applicationEndDate = r[r.length-1].returnValues.applicationEndDate
  			if(now >= resObj.applicationEndDate)
  				resObj.stage = 'Updating'
  		}
  	}else if(stage == 3){
  		resObj.stage = 'In Registry'
  	}
  	return resObj
  }
  getDataIPFS = async (ipfsHash) => {
	  try {
	    const url = 'https://cloudflare-ipfs.com/ipfs/' + ipfsHash;
	    const response = await fetch(url)        
	    const data = response.json()
	    return data;
	  } catch (e) {
	    //console.log('error ', e);
	    return null;
	  }
	}
  displayTime = (status) => {
  	if(!status)
  		return ''
  	var time
  	if(status.stage == 'Updating' || status.stage == 'New'|| status.stage == 'In Registry')
  		return ''
    
    else if(status.stage == 'In Application'){
       time = status.applicationEndDate
    }else if(status.stage == 'Vote - Commit'){
       time = status.commitEndDate
    }else if(status.stage == 'Vote - Reveal'){
       time = status.revealEndDate
    }
    if(!time)
    	return ''
  	if(time>0){
       return (
       	<span>
       	<Countdown date={time*1000} />
       	</span>
       	)
	  }else{
	      return ''
	  }
  	
      
  }
  displayStatus = (status) => {
  	if(status)
  		return status.stage;
  	else
  		return ''
  }
  displayUpdateButton = (item) => {
  	if(!item.status)
  		return ''
    let btnColor = "primary"
    if(item.isOwner && item.status.stage == 'Updating') {
  	return (<Button size="small" onClick={this.props.handleClickOpen.bind(this, item, TCRUtil, 'Update Item')} variant="outlined" color={btnColor}>
        Update
      </Button>
      )
    }
  }

  displayActionButton = (item) => {
  	if(!item.status)
  		return ''
    var disabled = true
    var dialogcomponent = ''
    var dialogtitle = ''
    var btnColor = "primary"
    if(item.creator == this.props.accounts[0])
      disabled = false
  	if(item.status.stage == 'Updating')
  		return ''
    else if(item.status.stage == 'New'){
      dialogcomponent = Apply
      dialogtitle = 'Apply'
    }else if(item.status.stage == 'In Application' || item.status.stage == 'In Registry'){
      dialogcomponent = Challenge
      dialogtitle = 'Challenge'
      btnColor = "secondary"
      disabled = true
      if(item.creator != this.props.accounts[0])
        disabled = false
    }else if(item.status.stage == 'Vote - Commit'){
      dialogcomponent = Voting
      dialogtitle = 'Vote'
      btnColor = "default"
      disabled = false
    }else if(item.status.stage == 'Vote - Reveal'){
      dialogcomponent = Voting
      dialogtitle = 'Reveal'
      btnColor = "default"
      disabled = false
    }

    
  	return (<Button size="small" disabled={disabled} onClick={this.props.handleClickOpen.bind(this, item, dialogcomponent, dialogtitle)} variant="outlined" color={btnColor}>
        {dialogtitle}
      </Button>
      )
  }
  render(){
  	return(
  		<TableRow key={this.state.item.itemHash}>
                    <TableCell component="th" scope="row">
                      Name: <b>{this.state.item.name}</b> <br/>
                      Email: <b>{this.state.item.email}</b><br/>
                      Address:<b>{this.state.item.address}</b>
                    </TableCell>
                    <TableCell>{this.displayStatus(this.state.item.status)}</TableCell>
                    <TableCell>{this.displayTime(this.state.item.status)}</TableCell>
                    <TableCell>{this.displayActionButton(this.state.item)} {this.displayUpdateButton(this.state.item)}</TableCell>
                  </TableRow>
        )
  }
}
ItemRow.contextTypes = {
    drizzle: PropTypes.object,
}
const mapStateToProps = state => {
    return {
      accounts: state.accounts,
      contracts: state.contracts,
    }
}
export default (drizzleConnect(ItemRow, mapStateToProps));
