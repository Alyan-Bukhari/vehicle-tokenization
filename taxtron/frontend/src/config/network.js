export const network = {
  chainId: Number(import.meta.env.VITE_CHAIN_ID || 1337),
  name: import.meta.env.VITE_CHAIN_NAME || 'Vehicle Tokenization Local',
  rpcUrl: import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:7545',
  symbol: 'ETH',
};
