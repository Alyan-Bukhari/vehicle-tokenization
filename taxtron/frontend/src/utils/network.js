export async function ensureLocalNetwork() {
  if(!window.ethereum) throw new Error('Install MetaMask to sign vehicle transactions. You can browse the app without a wallet.');
  const chainId=await window.ethereum.request({method:'eth_chainId'});
  if(chainId==='0x539') return;
  try {await window.ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:'0x539'}]});}
  catch(error) {
    if(error.code!==4902) throw error;
    await window.ethereum.request({method:'wallet_addEthereumChain',params:[{chainId:'0x539',chainName:'Vehicle Tokenization Local',rpcUrls:['http://127.0.0.1:7545'],nativeCurrency:{name:'Ether',symbol:'ETH',decimals:18}}]});
    await window.ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:'0x539'}]});
  }
}
