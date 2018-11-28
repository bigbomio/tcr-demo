import React, { Component } from 'react'
import PropTypes from 'prop-types'
import '../../App.css'
import { drizzleConnect } from 'drizzle-react'
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import RadioGroup from '@material-ui/core/RadioGroup';
import Radio from '@material-ui/core/Radio';
import TextField from '@material-ui/core/TextField';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Countdown from '../join/Countdown'

const styles = theme => ({
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
  },

});

class Voting extends Component {
    constructor(props, context) {
      super(props)
      this.contracts = context.drizzle.contracts
      this.Utils = context.drizzle.web3.utils;  
      this.handleCommitVote = this.handleCommitVote.bind(this);
      this.claimReward = this.claimReward.bind(this);
      this.handeRevealVote = this.handeRevealVote.bind(this);
      var initialState = {bboAmount:0, submiting:false};
      this.state = initialState;
      this.BBUnOrderedTCRInstance = this.contracts.BBUnOrderedTCR;
      this.BBOInstance = this.contracts.BBOTest;
      this.VotingInstance = this.contracts.BBVoting;
      this.VotingHeplperInstance = this.contracts.BBVotingHelper; 
      this.web3 = context.drizzle.web3;
      this.handleChange = this.handleChange.bind(this);

    }
    componentDidMount = () => {
       this.setState({
            'pollStatus':this.props.componentPros.status.pollStatus,
            'commitEndDate': this.props.componentPros.status.commitEndDate,
            'revealEndDate': this.props.componentPros.status.revealEndDate,
            'pollID':this.props.componentPros.status.pollID
        });  
    }
    
    async getERC20Instance(token) {
      return await new this.context.drizzle.web3.eth.Contract(this.BBOInstance.abi, token, {
          from: this.props.accounts[0], // default from address
          gasPrice: '20000000000' // default gas price in wei ~20gwei
        });
    }
    getReward(){
      let that = this
      return this.BBUnOrderedTCRInstance.methods.voterReward(this.props.accounts[0], this.state.pollID).call().then(function(reward){
        if(reward!= that.state.voterReward)
          that.setState({voterReward:reward});
      });
      
    }
    async handleGetPullID() {
        //console.log('handleGetPullID');
    }

    async claimReward() {
        if (this.state['submiting'])
            return;
        this.setState({
            'submiting': true
        });
        let pollID = this.state['pollID'];

        this.BBUnOrderedTCRInstance.methods.claimReward(pollID).send();
        this.setState({
            'submiting': false
        });
    }

    
    async handeRevealVote() {
        if (this.state['submiting'])
            return;
        this.setState({
            'submiting': true
        });
        let pollID = this.state['pollID'];
        let choice = this.state['choice'];
        let salt   = this.state['saltPassword'];

        if(choice == null) {
            alert('Support or Not ?');
            this.setState({
                'submiting': false
            });
            return;
        };

        if(salt == null) {
            alert('Input Password');
            this.setState({
                'submiting': false
            });
            return;
        };

        await this.VotingInstance.methods.revealVote(pollID, choice, salt).send();
        this.setState({
            'submiting': false
        });

    }

    async handleCommitVote() {
        if (this.state['submiting'])
            return;
        this.setState({
            'submiting': true
        });
        let that = this;
        let bboAmount = this.state['bboAmountVote'];
        let pollID = this.state['pollID'];
        let choice = this.state['choice'];
        let salt   = this.state.saltPassword

        

        //console.log('choice',choice);
        //console.log('salt',salt);

        let token = await this.contracts.BBTCRHelper.methods.getToken(this.props.componentPros.listID).call();
    
        let ERCIntance = await this.getERC20Instance(token);

        var allowance = await ERCIntance.methods.allowance(this.props.accounts[0], this.VotingInstance.address).call();

        //console.log(allowance)
        
        let secretHash = this.Utils.soliditySha3(choice, salt);
        bboAmount = this.Utils.toWei(bboAmount, 'ether');
        if(allowance == 0){
          ERCIntance.methods.approve(this.VotingInstance.address, this.Utils.toWei(new this.Utils.BN(Math.pow(2,52)), 'ether')).send();
          setTimeout(function () {
             that.VotingInstance.methods.commitVote(pollID, secretHash, bboAmount).send();
          }, 5000);
        }else
        this.VotingInstance.methods.commitVote(pollID, secretHash, bboAmount).send();

        this.setState({
            'submiting': false
        });
    }


    
    handleChange = key => (event, value) => {
        this.setState({
          [key]: event.target.value,
        });
      };

    handleDownload() {
        alert('TODO here! Not implement yet!!! Please come back later');
    }


    displayTime(){
      let now = new Date()/1000;
      let time = this.state.commitEndDate>now?this.state.commitEndDate:this.state.revealEndDate>now?this.state.revealEndDate:0
       if(time>0){
           return (
            <p>Time Remaining:
            <span>
            <Countdown date={time*1000} />
            </span>
             </p>
            )
        }else{
            return ''
        }
    }
    displayForm(){
        let now = new Date()/1000;
        //console.log(this.state.commitEndDate < now && now < this.state.revealEndDate)
        if(this.state.commitEndDate && this.state.revealEndDate){
            if(now < this.state.commitEndDate){
                if(this.state.votingState != 'Commit Vote')
                    this.setState({votingState: 'Commit Vote'})
                return this.displayCommit()
            }else if(this.state.commitEndDate < now && now < this.state.revealEndDate){
                if(this.state.votingState != 'Reveal Vote')
                    this.setState({votingState: 'Reveal Vote'})
                return this.displayReveal()
            }
            else{
                if(this.state.votingState != 'Finished Vote')
                    this.setState({votingState: 'Finished Vote'})
                return this.displayReward()
            }
        }else{
            return 'Loading...'
        }
    }
    displayReward(){
        this.getReward();
        return(
            <div>
            <h3>Your Reward: {this.state.voterReward}</h3>
            
            <Button variant="contained" size="small" 
             color="primary"
              onClick={this.claimReward}>Claim Reward</Button>
            </div>
        )
    }
    displayReveal(){
        const { classes } = this.props;
        return(
            <div>
            <h3>Select your choice to reveal this vote</h3>
            <FormControl component="fieldset">
              <FormLabel>Support or Not</FormLabel>
              <RadioGroup
                row
                name="icon"
                aria-label="icon"
                value={this.state.choice}
                onChange={this.handleChange('choice')}
              >
                <FormControlLabel value="1" control={<Radio />} label="Support" />
                <FormControlLabel value="0" control={<Radio />} label="Not" />
                <TextField
              label="Encrypt Password"
              value={this.state.saltPassword}
              onChange={this.handleChange('saltPassword')}
              type="number"
              className={classes.textField}
              InputLabelProps={{
                shrink: true,
              }}
              margin="normal"
              variant="outlined"
            />
              </RadioGroup>
            </FormControl>
            <br/>
             <Button variant="contained" size="small" 
             color=""
              onClick={this.handleDownload}>Upload Encrypt File</Button>
              <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
              <Button variant="contained" size="small" 
             color="primary"
              onClick={this.handeRevealVote}>Reveal Vote</Button>
            </div>
        )
    }
    displayCommit(){
        const { classes } = this.props;
        return(
            <div>
            <FormControl component="fieldset">
              <FormLabel>Support or Not</FormLabel>
              <RadioGroup
                row
                name="icon"
                aria-label="icon"
                value={this.state.choice}
                onChange={this.handleChange('choice')}
              >
                <FormControlLabel value="1" control={<Radio />} label="Support" />
                <FormControlLabel value="0" control={<Radio />} label="Not" />
                <TextField
              label="Encrypt Password"
              value={this.state.saltPassword}
              onChange={this.handleChange('saltPassword')}
              type="number"
              className={classes.textField}
              InputLabelProps={{
                shrink: true,
              }}
              margin="normal"
              variant="outlined"
            />
              </RadioGroup>
            </FormControl>
            <br/>
            <TextField
              label="Vote Amount"
              value={this.state.bboAmountVote}
              onChange={this.handleChange('bboAmountVote')}
              type="number"
              className={classes.textField}
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
              margin="normal"
              variant="outlined"
            />
            <br/>
             <Button variant="contained" size="small" 
             color=""
              onClick={this.handleDownload}>Download</Button>
              <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
              <Button variant="contained" size="small" 
             color="primary"
              onClick={this.handleCommitVote}>Commit Vote</Button>
            </div>
        )
    }
    render() {
        if(this.account != this.props.accounts[0]) {
            this.account = this.props.accounts[0]
        }
        
        return (
            <div>
            <h3 className = "newstype">Stage : {this.state.votingState}</h3>
            <p>Name: {this.props.componentPros.name} <br/>
            Email: {this.props.componentPros.email} <br/>
            Address: {this.props.componentPros.address} </p>
            <p>Poll ID: <strong>{this.state.pollID}</strong></p>
            <p>{this.displayTime()} </p>
            {this.displayForm()}

          </div>
        );
    }
    
}

Voting.contextTypes = {
    drizzle: PropTypes.object
}
Voting.propTypes = {
  classes: PropTypes.object.isRequired,
};
const mapStateToProps = state => {
    return {
      accounts: state.accounts,
      contracts: state.contracts
    }
}
  
export default withStyles(styles)(drizzleConnect(Voting, mapStateToProps))