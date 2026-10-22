import Web3 from 'web3';
// Connecting is an explicit user action; importing a page never opens a wallet popup.
const web3 = typeof window !== 'undefined' && window.ethereum ? new Web3(window.ethereum) : null;
export default web3;
