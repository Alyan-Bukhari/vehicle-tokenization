const VehicleRegistration = artifacts.require("VehicleRegistration");
const VehicleNFT = artifacts.require("VehicleNFT");

module.exports = async function (deployer, network, accounts) {
  // Use the first account as the initial owner
  const initialOwner = accounts[0];
  console.log("Deploying VehicleNFT with owner:", initialOwner);

  await deployer.deploy(VehicleNFT, initialOwner, VehicleRegistration.address);
  const registry = await VehicleRegistration.deployed();
  await registry.setCertificateContract(VehicleNFT.address, {from:initialOwner});

  console.log("✅ VehicleNFT deployed successfully!");
  console.log("📍 Contract address:", VehicleNFT.address);
};
