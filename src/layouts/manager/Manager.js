import React, { Component } from 'react'
import PropTypes from 'prop-types'
import '../../App.css'
import { drizzleConnect } from 'drizzle-react'
import CurrencyFormat from 'react-currency-format';
import NewList from '../newList/NewList'
import OwnerTool from '../ownerTool/OwnerTool'
import Button from '@material-ui/core/Button';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import ListIDPanel from '../listing/ListIDPanel'
import { withStyles } from '@material-ui/core/styles';


const styles = theme => ({
  root: {
    width: '100%',
    marginTop: theme.spacing.unit * 3,
  },
  table: {
    minWidth: 500,
  },
  tableWrapper: {
    overflowX: 'auto',
  },
   button: {
    margin: theme.spacing.unit,
  },
});

class SimpleDialog extends React.Component {
  handleClose = () => {
    this.props.onClose(this.props.selectedValue);
  };

  handleListItemClick = value => {
    this.props.onClose(value);
  };

  render() {
    const { classes, onClose, selectedValue, componentPros, title, ...other } = this.props;
    var  ChildComponent = this.props.component
    if(!this.props.component)
      return '';
    return (
      <Dialog onClose={this.handleClose} aria-labelledby="simple-dialog-title" {...other}>
        <DialogTitle id="simple-dialog-title">{title}</DialogTitle>
        <DialogContent>
        <ChildComponent componentPros={this.props.componentPros} />
        </DialogContent>
      </Dialog>
    );
  }
}

SimpleDialog.propTypes = {
  classes: PropTypes.object.isRequired,
  onClose: PropTypes.func,
  selectedValue: PropTypes.string,
  title: PropTypes.string
};

const SimpleDialogWrapped = withStyles(styles)(SimpleDialog);

class Manager extends Component {
  constructor(props, context) {
    super(props)
    this.contracts = context.drizzle.contracts
    var initialState = {bboAmount:0, submiting:false};
    this.account = this.props.accounts[0];
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.state = initialState;
    this.Utils = context.drizzle.web3.utils;
    this.context = context;

  
  }

  async getParams() {

    let paramTCR = await this.contracts.BBTCRHelper.methods.getListParamsUnOrdered(10).call();
    this.context.paramTCR = paramTCR;
  }
  
 
  async handleSubmit() {
    // check allowance

    //console.log('handleSubmit ....')
    if(this.state['bboAmount']>0){
      if(this.state['submiting'])
        return;
      this.setState({'submiting':true});
      var allowance = await this.contracts['BBOTest'].methods.allowance(this.props.accounts[0], this.contracts.BBOHoldingContract.address).call();
      //var allowance = this.props.contracts['BBOTest']['allowance'][this.bboAllowanceKey].value;
      //console.log(allowance);
      var that = this;
      if(allowance > 0){
        if(this.context.drizzle.web3.utils.fromWei(allowance, 'ether') == this.state['bboAmount']){
         return this.contracts.BBOHoldingContract.methods['depositBBO'].cacheSend(...[]);
        }else{
          // todo set allowance to 0
          
          let otx = this.contracts.BBOTest.methods.approve(this.contracts.BBOHoldingContract.address, 0).send();
          setTimeout(function(){
            that.contracts.BBOTest.methods.approve(that.contracts.BBOHoldingContract.address,  that.context.drizzle.web3.utils.toWei(that.state['bboAmount'], 'ether')).send();
            setTimeout(function(){
                that.setState({'submiting':false});
                 
            }, 5000);
          }, 5000);
        }
        //console.log('here 1');
      }else{
        // do approve
        
          let otx2 = this.contracts.BBOTest.methods.approve(this.contracts.BBOHoldingContract.address, this.context.drizzle.web3.utils.toWei(this.state['bboAmount'], 'ether')).send()
          setTimeout(function(){
            that.setState({'submiting':false});
            }, 5000);
          
      }
    }else{
      alert('BBO Amount must be greater 0');
    }
  }


  handleInputChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  handleClickOpen = (componentPros, dialogcomponent, dialogtitle) => {
    this.setState({ dialogcomponent: dialogcomponent, dialogtitle: dialogtitle, componentPros: componentPros });
    this.setState({open:true})
  };

  onModalClose = ()=> {
    this.setState({open:false})
  }
  componentDidMount(){
    // let that = this;
    //  this.contracts.BBTCRHelper.methods.getListParams(10).call().then(function(rs){
    //     //console.log(rs)
    //     that.setState({listParams: rs});

    //   });
  }
  displayParams =() => {
    if(this.state.listParams){
       if(this.props.accounts[0] == '0xb10ca39DFa4903AE057E8C26E39377cfb4989551')
        return(
          <div>
          <h3>Params</h3>
           <p>Application Duration: {this.state.listParams.applicationDuration} (s)</p>
          <p>Application Min Stake: {this.Utils.fromWei(this.state.listParams.minStake,'ether' )} BBO</p>
          <p>Commit Voting Duration: {this.state.listParams.commitDuration} (s)</p>
          <p>Reveal Voting Duration: {this.state.listParams.revealDuration} (s)</p>
          <p>Set Prams TCR</p>
              <Button size="small" onClick={this.handleClickOpen.bind(this, {}, OwnerTool, 'Set TCR Params only Owner')} color = "primary" variant="outlined">Update Params</Button>
          </div>
        )
      else
        return (
          <div>
          <h3>Params</h3>
          <p>Application Duration: {this.state.listParams.applicationDuration} (s)</p>
          <p>Application Min Stake: {this.Utils.fromWei(this.state.listParams.minStake,'ether' )} BBO</p>
          <p>Commit Voting Duration: {this.state.listParams.commitDuration} (s)</p>
          <p>Reveal Voting Duration: {this.state.listParams.revealDuration} (s)</p>
          </div>
          )
    }
    else
      return 'Loading...'
  }
  displayCreateBtn(){
    //console.log(this.props.accounts[0])
    if(this.props.accounts[0] == '0xb10ca39DFa4903AE057E8C26E39377cfb4989551')
    return(
        <div>
          <h3>Create New List &nbsp;&nbsp;&nbsp;&nbsp;
            <Button size="small" onClick={this.handleClickOpen.bind(this, {}, NewList, 'New List Form')} color = "primary" variant="outlined">New</Button>
          </h3>
        </div>
      )
    else
      return ''
  }
  render() {
  
    return (
      <main className="container">
        <div className="">
          <div className="pure-u-1-1 header">
          <h1 className = "newstype">Listing Demo</h1>
          </div>
          {this.displayCreateBtn()}
          <ListIDPanel></ListIDPanel>
          <SimpleDialogWrapped 
         open={this.state.open} 
         component={this.state.dialogcomponent}
         title={this.state.dialogtitle}
         onClose={this.onModalClose}
         componentPros={this.state.componentPros}
        />
        </div>
      </main>
    )
  }
}

Manager.contextTypes = {
  drizzle: PropTypes.object
}
const mapStateToProps = state => {
  return {
    accounts: state.accounts,
    contracts: state.contracts
  }
}

export default drizzleConnect(Manager, mapStateToProps)
