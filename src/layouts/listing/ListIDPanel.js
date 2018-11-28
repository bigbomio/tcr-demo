import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableFooter from '@material-ui/core/TableFooter';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import TableHead from '@material-ui/core/TableHead';
import Paper from '@material-ui/core/Paper';
import IconButton from '@material-ui/core/IconButton';
import FirstPageIcon from '@material-ui/icons/FirstPage';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import LastPageIcon from '@material-ui/icons/LastPage';
import { drizzleConnect } from 'drizzle-react'
import Button from '@material-ui/core/Button';

import OwnerTool from '../ownerTool/OwnerTool'
import UpdateToken from '../updateToken/UpdateToken'
import { SimpleDialogWrapped, TablePaginationActionsWrapped } from './UnorderTCRListing'
import { Link } from 'react-router-dom'


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


class ListIDPanel extends React.Component {
  constructor(props, context) {
    super(props)
    this.items = [];// [{name:'a',status: 'Apply', created: 1542605000}, {name:'b',status: 'Challenge', created: 1542605105}, {name:'c',status: 'In ...', created: 1542605005}]
    this.state = {
        rows: [],
        page: 0,
        rowsPerPage: 10,
        open:false
    };
    this.context = context;
    this.contracts = context.drizzle.contracts;
    this.Utils = context.drizzle.web3.utils; 
    this.count = 0; 
    this.TokenABI = context.drizzle.contracts.BBOTest.abi;
    this.fromBlock = context.drizzle.options.params.fromBlock
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

  componentDidMount() {
      ////console.log(this.context.drizzle.web3.eth.Contract);
      //console.log('ho')
      var that = this;
      this.contracts.BBTCRHelper.events.CreateListID({
        //  filter : {owner : this.props.accounts[0]},
          fromBlock: this.fromBlock
      }, function(error, event){})
      .on('data', async function(event){
         // //console.log(event.returnValues); 
         let ipfsHash =  this.Utils.toAscii(event.returnValues.nameHash);
         let data = await this.getDataIPFS(ipfsHash);
         const res = await this.context.drizzle.web3.eth.getBlock(event.blockNumber);
         let listID = await event.returnValues.listID;
         let token = await this.contracts.BBTCRHelper.methods.getToken(listID).call();

         let tokenContract = await new this.context.drizzle.web3.eth.Contract(this.TokenABI, token, {
          from: this.props.accounts[0], // default from address
          gasPrice: '20000000000' // default gas price in wei ~20gwei
        });
                 
         let tokenname = await this.getTokenName(tokenContract);

          if(data) {
            let obj = {name: data.name, listID: listID, token: token, tokenName : tokenname ,created: res.timestamp, itemHash : that.Utils.sha3(ipfsHash)};
            this.items.push(obj);
            this.setState({rows: this.items})
          }
      }.bind(this))
      .on('changed', function(event){
          // remove event from local database
      })
      .on('error', console.error);

   
  }

   getTokenName(tokenContract) {
     return new Promise(async(resolve, reject) => {
      tokenContract.methods.name.call().call(function(error ,result){
        if(error) {
            //console.log('error :' + error);
            resolve(null);
        } else {
           resolve(result);
        }
      });
     })
    
  }
  
  handleChangePage = (event, page) => {
    this.setState({ page });
  };
  handleClickOpen = (componentPros, dialogcomponent, dialogtitle) => {
    this.setState({ dialogcomponent: dialogcomponent, dialogtitle: dialogtitle, componentPros: componentPros });
    this.setState({open:true})
  };

  handleChangeRowsPerPage = event => {
    this.setState({ rowsPerPage: event.target.value });
  };
  displayTime(time){
      if(time>0){
       return new Date(time*1000).toISOString()
      }else{
          return new Date().toISOString()
      }
  }
  displayUpdateButton = (item) => {
    let componentPros = {name:item.name, listID: item.listID, token: item.token, tokenName : item.tokenName}
    let btnColor = "primary"
    if(this.props.accounts[0] === '0xb10ca39DFa4903AE057E8C26E39377cfb4989551')
  	return (<Button size="small" onClick={this.handleClickOpen.bind(this, componentPros, UpdateToken, 'Update Token')} variant="outlined" color={btnColor}>
        Update Token
      </Button>
      )
    else
      return ''
  }

  displayActionButton = (item) => {

    let componentPros = {name:item.name, listID: item.listID, token: item.token}
      var btnColor = "primary" 
      if(this.props.accounts[0] === '0xb10ca39DFa4903AE057E8C26E39377cfb4989551')
      return (<Button size="small" onClick={this.handleClickOpen.bind(this, componentPros, OwnerTool, "Update Prams")} variant="outlined" color={btnColor}>
          Update Params
        </Button>
        )
        else
          return ''

  }
  onModalClose = ()=> {
    this.setState({open:false})
  }
  render() {

    const { classes } = this.props;
    const { rows, rowsPerPage, page } = this.state;
    const emptyRows = rowsPerPage - Math.min(rowsPerPage, rows.length - page * rowsPerPage);

    return (
      <Paper className={classes.root}>
        <div className={classes.tableWrapper}>
          <Table className={classes.table}>
            <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Token</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
            <TableBody>
              {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(row => {
                return (
                  <TableRow key={row.listID}>
                    <TableCell component="th" scope="row">
                    <b><Link to={'/listing/' + row.listID}>{row.name}</Link></b>
                    </TableCell>
                    <TableCell>{this.displayTime(row.created)}</TableCell>
                    <TableCell>{row.tokenName}</TableCell>
                    <TableCell>{this.displayUpdateButton(row)} {this.displayActionButton(row)}</TableCell>
                  </TableRow>
                );
              })}
              {emptyRows > 0 && (
                <TableRow style={{ height: 48 * emptyRows }}>
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  colSpan={3}
                  count={rows.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onChangePage={this.handleChangePage}
                  onChangeRowsPerPage={this.handleChangeRowsPerPage}
                  ActionsComponent={TablePaginationActionsWrapped}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
        <SimpleDialogWrapped 
         open={this.state.open} 
         component={this.state.dialogcomponent}
         title={this.state.dialogtitle}
         onClose={this.onModalClose}
         componentPros={this.state.componentPros}
        />
      </Paper>
    );
  }
}

ListIDPanel.propTypes = {
  classes: PropTypes.object.isRequired,
};
ListIDPanel.contextTypes = {
    drizzle: PropTypes.object
}
const mapStateToProps = state => {
    return {
      accounts: state.accounts,
      contracts: state.contracts
    }
}
  
export default withStyles(styles)(drizzleConnect(ListIDPanel, mapStateToProps));
