import React, { Component } from 'react'
import PropTypes from 'prop-types'
import '../../App.css'
import { drizzleConnect } from 'drizzle-react'
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
    textField: {
      marginLeft: theme.spacing.unit,
      marginRight: theme.spacing.unit,
    },
  
  });
  

const IPFS = require('ipfs-mini');
const ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });


class RegisterItem extends Component {
    constructor(props, context) {
      super(props)
      this.contracts = context.drizzle.contracts
      this.Utils = context.drizzle.web3.utils;  
      this.updateParams = this.updateParams.bind(this);
      this.handleInputChange = this.handleInputChange.bind(this);
      var initialState = {bboAmount:0, submiting:false};
      this.state = initialState;
      this.BBExpertHash = this.contracts.BBExpertHash;
      this.BBUnOrderedTCRInstance = this.contracts.BBUnOrderedTCR;
      this.BBOInstance = this.contracts.BBOTest;  

    }

    async updateParams () {
        console.log('register');
        if (this.state['submiting'])
            return;
        var that = this;
        this.setState({
            'submiting': true
        });
        let fullName = that.state['fullName'];
        let address = that.state['address'];
        let email = that.state['email'];
        let phone = that.state['phone'];
        let linkedin = that.state['linkedin'];
        let bboAmount = that.state['tokenInput'];
        bboAmount = this.Utils.toWei(bboAmount, 'ether');

        if(fullName == null || address == null || email == null || phone == null) {
            that.setState({
                'submiting': false
            });
            return;
        }

       

        let paramTCR = await this.contracts.BBTCRHelper.methods.getListParams(this.props.componentPros.listID).call();
        let minStake = paramTCR.minStake;

        if(bboAmount < minStake) {
            alert('Token Amount must be greater ' + this.Utils.fromWei(minStake, 'ether'));
            that.setState({
                'submiting': false
            });
            return;
        }
       
        let token = await this.contracts.BBTCRHelper.methods.getToken(this.props.componentPros.listID).call();
        let ERCIntance = await this.getERC20Instance(token);

        var allowance = await ERCIntance.methods.allowance(this.props.accounts[0], this.BBUnOrderedTCRInstance.address).call();
        
        let data = {fullName, address, email, phone};

        console.log(data);

        ipfs.addJSON({fullName : fullName, address : address, email : email, phone : phone, linkedin:linkedin}, (err, result) => {
            if(err) {
                console.log(err);
                that.setState({
                    'submiting': false
                });
            } else {
                console.log('https://gateway.ipfs.io/ipfs/' + result)
                that.BBExpertHash.methods.pushData(that.Utils.toHex(result)).send();
                
                this.handleApply(ERCIntance, minStake, allowance ,bboAmount, that.Utils.sha3(result), 'Data');   
            }
             
          });
        
    }

    async handleApply (ERCIntance, minStake,allowance ,bboAmount,itemHash, dataHash) {
        console.log('itemHash', itemHash);
        console.log('List ID ', this.props.componentPros.listID);
        let that = this;

        if(allowance > minStake && bboAmount >= minStake) {
            that.BBUnOrderedTCRInstance.methods.apply(this.props.componentPros.listID, bboAmount,itemHash, that.Utils.toHex(dataHash)).send();
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

    async getERC20Instance(token) {
        return await new this.context.drizzle.web3.eth.Contract(this.BBOInstance.abi, token, {
            from: this.props.accounts[0], // default from address
            gasPrice: '20000000000' // default gas price in wei ~20gwei
          });
      }


    handleInputChange(event) {
        this.setState({ [event.target.name]: event.target.value });
    }

    render() {
        if(this.account != this.props.accounts[0]) {
            this.account = this.props.accounts[0]
        }
        const { classes } = this.props;

        return (
            <div className="container-fix-600">
            <p>
            <input className="input-bbo" key="fullName" type="text" name="fullName" placeholder = "Full Name" onChange={this.handleInputChange} />
            </p>
            <p>
            <input className="input-bbo" key="address" type="text" name="address" placeholder = "Address" onChange={this.handleInputChange} />
            </p>
            <p>
            <input className="input-bbo" key="email" type="text" name="email" placeholder = "Email" onChange={this.handleInputChange} />
            </p>
            <p>
            <input className="input-bbo" key="phone" type="text" name="phone" placeholder = "Phone Number" onChange={this.handleInputChange} />
            </p>
            <p>
            <input className="input-bbo" key="linkedin" type="text" name="linkedin" placeholder = "Website" onChange={this.handleInputChange} />
            </p>
            <TextField
              label="Stake Token Amount"
              name= "tokenInput"
              onChange={this.handleInputChange}
              type="number"
              className={classes.textField}
              InputLabelProps={{
                shrink: true,
              }}
              margin="normal"
              variant="outlined"
            />
            <p><button key="submit" className="sub-item-button-submit" type="button" onClick={this.updateParams}>Register</button>
            </p>
           
            
            <br/><br/>
          </div>
        );
    }
    
}

RegisterItem.contextTypes = {
    drizzle: PropTypes.object
}
const mapStateToProps = state => {
    return {
      accounts: state.accounts,
      contracts: state.contracts
    }
}
  
export default withStyles(styles)(drizzleConnect(RegisterItem, mapStateToProps))