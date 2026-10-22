const express=require('express');
const {web3}=require('../services/blockchain');
const router=express.Router();
router.get('/transactions/:hash',async(req,res,next)=>{
 try {
  const hash=req.params.hash;
  if(!/^0x[a-fA-F0-9]{64}$/.test(hash))return res.status(400).json({success:false,message:'Invalid transaction hash.'});
  const [transaction,receipt]=await Promise.all([web3.eth.getTransaction(hash),web3.eth.getTransactionReceipt(hash)]);
  if(!transaction)return res.status(404).json({success:false,message:'Transaction was not found on the local chain.'});
  res.json({success:true,data:{hash,from:transaction.from,to:transaction.to,valueEth:web3.utils.fromWei(transaction.value,'ether'),status:receipt?(receipt.status?'Confirmed':'Failed'):'Pending',blockNumber:receipt?.blockNumber?.toString()||null,gasUsed:receipt?.gasUsed?.toString()||null,chainId:'1337'}});
 }catch(error){res.status(503).json({success:false,message:'The local blockchain is unavailable or the transaction was not found.'});}
});
module.exports=router;
