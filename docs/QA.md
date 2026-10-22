# QA validation — October 23, 2026

The app supports owner registration and sign-in, inspection bookings, administrator approval, test-network payments, tax assessment, ownership transfers and NFT certificates.

## Verified

- The public production health endpoint pings MongoDB and reports `database.status: connected`. Catalogue, wallet lookup and appointment availability return JSON without Vercel authentication.
- Hosted disposable owner registration, sign-in, profile, booking, duplicate booking rejection, inspection submission, administrator approval, owner inspection reads and forged-payment rejection passed against the deployed API and Atlas database.
- Browser sign-in displayed the hosted QA owner's vehicle in the dashboard.
- Local API/blockchain integration: 9 passed, including registration, payment receipt validation, tax, NFT minting and approved ownership transfer.
- Solidity contract suite: 10 passed.
- API/session suite: 12 passed; its optional chain case is covered by the separate integration run above.
- Frontend lint, production build and backend syntax checks passed. Vite reports a bundle-size advisory.

## Fixes from this pass

Owner pages and the administrator inspection page now redirect signed-out visitors to sign-in, preserving the intended destination. Missing, corrupt and expired sessions are handled; API-rejected sessions clear only the affected account. Duplicate auth providers were removed. Notifications recover the owner's wallet after refresh. Dashboard notification/vehicle buttons navigate, and dashboard/notification API failures are visible. Inspection filter retries clear prior errors. Blockchain errors refer to the configured network rather than a local-only chain.

## Testing boundaries

Sepolia registry and NFT contracts are deployed and linked. The complete signing/payment/transfer flow was exercised on the local test chain; this pass does not certify every Sepolia wallet interaction in a user's MetaMask. The in-app browser has no MetaMask extension. Use an extension-capable browser and Sepolia test ETH for those actions.

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
