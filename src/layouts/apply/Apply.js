import React, { Component } from 'react'
import PropTypes from 'prop-types'
import '../../App.css'
import { drizzleConnect } from 'drizzle-react'
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
  },

});

class Apply extends Component {
    constructor(props, context) {
      super(props, context)
      this.contracts = context.drizzle.contracts
      this.Utils = context.drizzle.web3.utils;  
      this.handleApply = this.handleApply.bind(this);
      this.getParams = this.getParams.bind(this);
      this.handleChange = this.handleChange.bind(this);
      var initialState = {bboAmount:0, submiting:false};
      this.state = initialState;
      this.BBUnOrderedTCRInstance = this.contracts.BBUnOrderedTCR;
      this.BBOInstance = this.contracts.BBOTest;
    }

    async getParams () {
    }

    async getERC20Instance(token) {
      return await new this.context.drizzle.web3.eth.Contract(this.BBOInstance.abi, token, {
          from: this.props.accounts[0], // default from address
          gasPrice: '20000000000' // default gas price in wei ~20gwei
        });
    }
  
    handleChange = name => event => {
        this.setState({
          [name]: event.target.value,
        });
      };
    async handleApply() {

        if (this.state['submiting'])
            return;
        var that = this;
        this.setState({
            'submiting': true
        });

      

        let paramTCR = await this.contracts.BBTCRHelper.methods.getListParams(this.props.componentPros.listID).call();
        let minStake = paramTCR.minStake;
       
        let token = await this.contracts.BBTCRHelper.methods.getToken(this.props.componentPros.listID).call();
        let ERCIntance = await this.getERC20Instance(token);

       

        var allowance = await ERCIntance.methods.allowance(this.props.accounts[0], this.BBUnOrderedTCRInstance.address).call();
        //console.log('allowance',allowance);

        let bboAmount = that.state['bboAmount'];
        bboAmount = this.Utils.toWei(bboAmount, 'ether');
        //console.log('bboAmount',bboAmount);
      

        let itemHash = this.props.componentPros.itemHash
        let dataHash = this.props.componentPros.ipfsHash
        if(dataHash == null) {
            dataHash = 'data';
        }
        console.log('itemHash', itemHash);
        //console.log('dataHash', dataHash);

        if(allowance > minStake && bboAmount >= minStake) {
            that.BBUnOrderedTCRInstance.methods.apply(this.props.componentPros.listID, bboAmount,itemHash, that.Utils.toHex(dataHash)).send();
            that.setState({
                'submiting': false
            });
            return;
        }

        if(bboAmount < minStake) {
            alert('Token Amount must be greater ' + this.Utils.fromWei(minStake, 'ether'));
            that.setState({
                'submiting': false
            });
            return;
        }
        if(allowance > 0){
          ERCIntance.methods.approve(this.BBUnOrderedTCRInstance.address, 0).send();
          setTimeout(function () {
              
              ERCIntance.methods.approve(that.BBUnOrderedTCRInstance.address, that.Utils.toWei(new that.Utils.BN(Math.pow(2,52)), 'ether')).send();
              setTimeout(function () {
                                              
                  that.BBUnOrderedTCRInstance.methods.apply(that.props.componentPros.listID, bboAmount,itemHash, that.Utils.toHex(dataHash)).send();
                  that.setState({
                      'submiting': false
                  });

              }, 10000);
          }, 5000);

        }else{

            ERCIntance.methods.approve(that.BBUnOrderedTCRInstance.address, that.Utils.toWei( new that.Utils.BN(Math.pow(2,52)), 'ether')).send();
            setTimeout(function () {
                                            
                that.BBUnOrderedTCRInstance.methods.apply(that.props.componentPros.listID, bboAmount,itemHash, that.Utils.toHex(dataHash)).send();
                that.setState({
                    'submiting': false
                });

            }, 5000);
        }
    }

    render() {
        const { classes } = this.props;
        if(this.account != this.props.accounts[0]) {
            this.account = this.props.accounts[0]
        }
        if(!this.props.componentPros)
            return ''
        return (
            <div>
            <h3 className = "newstype">You are about apply to ITEM</h3>
            <p>Name: {this.props.componentPros.name}</p>
            <p>Email: {this.props.componentPros.email}</p>
            <p>Address: {this.props.componentPros.address}</p>
            <p>Phone: {this.props.componentPros.phone}</p>
            <TextField
              label="Stake Token Amount"
              value={this.state.bboAmount}
              onChange={this.handleChange('bboAmount')}
              type="number"
              className={classes.textField}
              InputLabelProps={{
                shrink: true,
              }}
              margin="normal"
              variant="outlined"
            />
            
            <p>
            <Button variant="contained" size="small" color="primary" onClick={this.handleApply}>Apply</Button>
            </p>
            <br/><br/>
          </div>
        );
    }
    
}

Apply.contextTypes = {
    drizzle: PropTypes.object
}
Apply.propTypes = {
  classes: PropTypes.object.isRequired,
};
const mapStateToProps = state => {
    return {
      accounts: state.accounts,
      contracts: state.contracts
    }
}
  
export default withStyles(styles)(drizzleConnect(Apply, mapStateToProps))