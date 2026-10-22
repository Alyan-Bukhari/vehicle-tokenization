# QA validation — October 23, 2026

The app supports owner registration and sign-in, inspection bookings, administrator approval, test-network payments, tax assessment, ownership transfers and NFT certificates.

## Verified

- The public production health endpoint pings MongoDB and reports `database.status: connected`. Catalogue, wallet lookup and appointment availability return JSON without Vercel authentication.
- Hosted disposable owner registration, sign-in, profile, booking, duplicate booking rejection, inspection submission, administrator approval, owner inspection reads and forged-payment rejection passed against the deployed API and Atlas database.
- Browser sign-in displayed the hosted QA owner's vehicle in the dashboard; the notifications button loaded the approved inspection. Image bytes persisted in MongoDB across a production redeployment.
- Live Sepolia registration, hosted receipt verification, tax assessment/payment, NFT mint, approved ownership transfer, NFT ownership synchronization and hosted transaction lookup passed using disposable wallets and free test ETH.
- Local API/blockchain integration: 9 passed, including registration, payment receipt validation, tax, NFT minting and approved ownership transfer.
- Solidity contract suite: 10 passed.
- API/session suite: 12 passed; its optional chain case is covered by the separate integration run above.
- Frontend lint, production build and backend syntax checks passed. Vite reports a bundle-size advisory.

## Fixes from this pass

Owner pages and the administrator inspection page now redirect signed-out visitors to sign-in, preserving the intended destination. Missing, corrupt and expired sessions are handled; API-rejected sessions clear only the affected account. Duplicate auth providers were removed. Notifications recover the owner's wallet after refresh. Dashboard notification/vehicle buttons navigate, and dashboard/notification API failures are visible. Inspection filter retries clear prior errors. Blockchain errors refer to the configured network rather than a local-only chain. Notifications use the current owner profile. Certificate reads use one block snapshot and the confirmed mint block after minting; a failed or rejected mint no longer falls back to a second wallet transaction. The explorer button opens Sepolia Etherscan.

## Testing boundaries

Sepolia registry and NFT contracts are deployed and linked. The complete signing/payment/transfer flow was exercised on both the local test chain and Sepolia through QA scripts; this pass does not certify every wallet-extension popup in a user's MetaMask. The in-app browser has no MetaMask extension. Use an extension-capable browser and Sepolia test ETH for those actions.

This remains a testnet prototype, with demonstration fees and no independent smart-contract security audit. An unclaimed ephemeral Atlas cluster pauses after two days; claim the provisioned cluster to retain the database. Do not treat a successful QA run as a guarantee of a defect-free or production-certified system.

## Repeat checks

```sh
npm run check
npm test
npm run test:integration
npm run test:contracts
npm run lint
npm run build
npm run check:hosted
```

Run `npm run dev` first for local services and run the chain suites sequentially. Hosted checks use public requests without bypass tokens. Test secrets and temporary hosted QA identifiers belong only in ignored local files.

## Public Sepolia evidence

- [Registration transaction](https://sepolia.etherscan.io/tx/0xf1a18313d457e69c7b77f757b32b0465af714305f5c2c8afc3557d21240ab07b)
- [Tax transaction](https://sepolia.etherscan.io/tx/0xa3a9b341fc54d15e9ac64004d248225f57aa8a0068ff3d2214216f6ff0038fdf)
- [Mint transaction](https://sepolia.etherscan.io/tx/0xdf1abc65c6817cd0cd908e54a1c3874995224116a174afd170fb9cd8186fa2b5)
- [Transfer transaction](https://sepolia.etherscan.io/tx/0x59b3dca35ab8daf5c43d903f96a78603ead73f0133ccbde094ddc1f95b494a60)

The public chain retains synthetic QA records permanently. Temporary hosted QA records and images are removed after browser verification; private QA wallet keys are never committed.
