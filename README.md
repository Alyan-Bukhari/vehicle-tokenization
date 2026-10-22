# Vehicle Tokenization

A locally runnable vehicle registration and taxation app built from TaxTron. Owners can submit vehicles for inspection, book appointments, pay registration and tax on a local Ethereum chain, mint ownership certificates, and transfer a vehicle after admin approval.

## Quick start

Use **Node.js 22.12 or newer** (Node 22 recommended), npm and Git.

```sh
git clone https://github.com/Alyan-Bukhari/vehicle-tokenization.git
cd vehicle-tokenization
npm ci
npm run setup
npm run dev
```

On macOS, setup downloads MongoDB 7.0 for your processor if needed. On Linux or Windows, start MongoDB yourself or run `docker compose up -d` before `npm run dev`. The dev command reuses already-running MongoDB/Ganache services, otherwise starts the local ones. It deploys missing contracts, synchronizes addresses/ABIs, creates the admin, and seeds the vehicle catalogue without deleting existing entries.

Open **http://127.0.0.1:5173/**. Admin login is **http://127.0.0.1:5173/admin/login**. Default local credentials: **admin / 12345678**. Change `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `taxtron/backend/.env` before first startup to choose your own credentials. Changing the env file later does not reset an existing account.

Services bind to loopback: frontend 5173, API 5001, MongoDB 27017, Ganache 7545. Port 5001 avoids macOS AirPlay's use of 5000. Logs and persistent database/chain files live in `.local/`. The Ganache wallet seed is preserved there too, so funded accounts remain stable after restarts. Uploaded photos live in `taxtron/backend/uploads/`. Neither secrets nor runtime data are committed.

Press Ctrl+C in the dev terminal to stop the services it started. Services it reused remain running. Do not delete `.local/` unless you intend to reset local data.

## Wallet setup

Install MetaMask in a browser with extension support. The in-app browser can show the UI and admin pages, but does not provide MetaMask.

1. Add the local network: RPC `http://127.0.0.1:7545`, chain ID `1337`, currency `ETH`. Connecting in the app can offer to add/switch this network.
2. Import one of Ganache's funded development accounts using its private key from `.local/logs/ganache.log`. These are disposable local-chain accounts; never use them on a public network.
3. Use Ganache account **0** for authority actions such as setting tax. Use a different funded account for vehicle owners.

The network ID used by Truffle is `5777`; MetaMask uses chain ID `1337`. Both are intentional.

## Try the complete flow

```sh
npm run seed:demo
```

This creates `owner@vehicle.local` and `buyer@vehicle.local`, both with password `VehicleDemo123!`, using Ganache accounts 1 and 2. The owner has an approved Toyota Corolla with registration paid, an NFT minted, and a 1,000-unit tax assessment ready to pay. The seed uses real local transactions and is repeatable. It never resets an existing user's password or transfers an existing demo vehicle back.

For a fresh registration, connect a funded owner wallet and create a user. The catalogue includes chassis `JHMFA1F80AS123456` (Honda Civic). Book an appointment and submit the vehicle; log in as admin to approve it and assign a registration number. Photos upload to local storage without Cloudinary or Pinata keys. Return as the owner to pay the registration fee and mint the certificate. The authority wallet can set tax on the admin tax page, and the owner can pay it. For transfers, find the recipient by CNIC, submit the request, approve it as admin, then confirm the transfer as the current owner. The registry and NFT transfer in the same transaction.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local stack |
| `npm run setup` | Install app packages and create local environment files |
| `npm run deploy` | Compile/redeploy contracts and synchronize frontend addresses |
| `npm run seed:demo` | Add funded, usable demo accounts and a tokenized vehicle |
| `npm run build` | Build the frontend |
| `npm run lint` | Check frontend code |
| `npm run check` | Check backend JavaScript syntax |
| `npm test` | API regression tests, including authentication, bookings, uploads and CSV import |
| `npm run test:contracts` | Contract lifecycle and authorization tests; Ganache must be running |
| `npm run test:integration` | Full API/database/blockchain lifecycle; MongoDB, Ganache and deployed contracts required |

A GitHub Actions workflow template is provided at `docs/github-actions-ci.yml`. To activate CI, copy it to `.github/workflows/ci.yml` using a GitHub sign-in with workflow permission.

API tests create and remove their own test database. The blockchain integration test uses a snapshot and reverts it; run chain test commands sequentially. Contract tests deploy temporary test contracts on the local chain.

After deliberately redeploying, restart the dev process. Existing database vehicle records refer to the old chain state and must be registered again on the new registry. Persistent startup does not redeploy existing contracts. When resetting chain state, clear stale MetaMask account activity/nonce data too.

## Reliability improvements

- One startup command with persistent local services and automatic contract wiring.
- Matching appointment/inspection IDs, atomic booking conflict protection, Pakistan-time date handling, and preserved expired-appointment history.
- Database-backed admin/user sessions and resource ownership checks.
- Payment receipts checked against the deployed registry, wallet, inspection event, vehicle details and payment state before the database is updated.
- Actual approved ownership transfers instead of simulated transaction hashes.
- NFT minting tied to a paid registered vehicle; certificates follow registry ownership atomically.
- Consistent demo PKR-to-wei conversion for fees and tax, with renewed tax assessments marked unpaid.
- Local photo uploads, proper quoted CSV parsing, non-destructive catalogue seeding, declared PDF dependencies, and case-correct imports for Linux.
- Fresh repository history, generated local secrets, ignored environment files and no third-party API keys in browser bundles.

## Scope

This is a **local development prototype**, not a production vehicle authority or a legally recognized ownership system. Displayed fees are demonstration values. The conversion of 1 demo PKR unit to `10^12` wei is a fixed test convention, not an exchange-rate quote. Bulk imports create inspection records only and do not imply on-chain registration or payment. The built-in registration assistant uses local response templates.

The Solidity contracts have automated tests but have not had an independent security audit. Direct chain registration is permissionless; API approval does not represent a government-signed on-chain attestation. Do not deploy this version for real-money or official registry use.

The inherited Truffle/Ganache development toolchain is deprecated and retains transitive npm audit findings. Application runtime packages are updated separately; build/watch-only Tailwind dependencies also have unresolved advisories. Migration to a maintained chain toolchain and a production threat review remain release work. Never run the local development accounts or admin defaults against real assets.

## Layout and provenance

`taxtron/backend` contains Express/MongoDB APIs, Solidity sources and migrations. `taxtron/frontend` contains the React/Vite app. `scripts` contains cross-platform setup and startup helpers; `tests` contains API integration coverage.

Based on the supplied [Tax-tron project](https://github.com/Abu-BakarYasir/Tax-tron). This repository starts with a clean source snapshot so previously committed environment secrets are not carried into its history. No new license is asserted over the original work.
