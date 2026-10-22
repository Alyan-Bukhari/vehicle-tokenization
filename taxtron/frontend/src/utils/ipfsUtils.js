/**
 * Utility functions for handling IPFS URLs and conversions
 */

/**
 * Convert IPFS URL to Pinata gateway URL for display
 * @param {string} ipfsUrl - The IPFS URL (ipfs://...)
 * @returns {string} - Gateway URL for display
 */
export const ipfsToGatewayUrl = (ipfsUrl) => {
  if (!ipfsUrl) return '';

  if (ipfsUrl.startsWith('ipfs://')) {
    const hash = ipfsUrl.replace('ipfs://', '');
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
  }

  // If it's already a gateway URL, return as is
  if (ipfsUrl.includes('gateway.pinata.cloud') || ipfsUrl.includes('ipfs.io')) {
    return ipfsUrl;
  }

  // If it's just a hash, convert to gateway URL
  if (ipfsUrl.startsWith('Qm') || ipfsUrl.startsWith('bafy')) {
    return `https://gateway.pinata.cloud/ipfs/${ipfsUrl}`;
  }

  return ipfsUrl;
};

/**
 * Extract IPFS hash from any IPFS URL format
 * @param {string} url - Any IPFS URL format
 * @returns {string} - Pure IPFS hash
 */
export const extractIpfsHash = (url) => {
  if (!url) return '';

  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', '');
  }

  if (url.includes('/ipfs/')) {
    return url.split('/ipfs/')[1];
  }

  return url;
};

/**
 * Check if a URL is an IPFS URL
 * @param {string} url - URL to check
 * @returns {boolean} - True if it's an IPFS URL
 */
export const isIpfsUrl = (url) => {
  if (!url) return false;

  return url.startsWith('ipfs://') ||
         url.includes('/ipfs/') ||
         url.startsWith('Qm') ||
         url.startsWith('bafy');
};

/**
 * Validate IPFS hash format
 * @param {string} hash - IPFS hash to validate
 * @returns {boolean} - True if valid IPFS hash
 */
export const isValidIpfsHash = (hash) => {
  if (!hash) return false;

  // Basic IPFS hash validation (simplified)
  return (hash.startsWith('Qm') && hash.length === 46) ||
         (hash.startsWith('bafy') && hash.length >= 50);
};
