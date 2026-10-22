import {network} from '../config/network';
export async function ensureLocalNetwork() {
  if(!window.ethereum) throw new Error('Install MetaMask to sign vehicle transactions. You can browse the app without a wallet.');
  const expected='0x'+network.chainId.toString(16);
  const chainId=await window.ethereum.request({method:'eth_chainId'});
  if(chainId===expected) return;
  try {await window.ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:expected}]});}
  catch(error) {
    if(error.code!==4902) throw error;
    await window.ethereum.request({method:'wallet_addEthereumChain',params:[{chainId:expected,chainName:network.name,rpcUrls:[network.rpcUrl],nativeCurrency:{name:'Ether',symbol:network.symbol,decimals:18}}]});
    await window.ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:expected}]});
  }
}
