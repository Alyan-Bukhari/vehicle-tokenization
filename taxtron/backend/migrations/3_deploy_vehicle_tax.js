const VehicleTax = artifacts.require("VehicleTax");

module.exports = function(deployer, network, accounts) {
  // Treasury address - using the second account as treasury
  const treasuryAddress = accounts[1] || "0x4E7f5a1D602ea6a326BA6272defB76CBB1Ff938d";

  console.log("Deploying VehicleTax contract...");
  console.log("Treasury address:", treasuryAddress);
  console.log("Deployer address:", accounts[0]);

  deployer.deploy(VehicleTax, treasuryAddress)
    .then(() => {
      console.log("✅ VehicleTax contract deployed successfully!");
      console.log("📍 Contract address:", VehicleTax.address);
      return VehicleTax.deployed();
    })
    .then(instance => {
      console.log("🧪 Testing contract functionality...");

      // Set tax rate for current year
      const currentYear = new Date().getFullYear();
      return instance.setYearlyTaxRate(currentYear, 1000, { from: accounts[0] });
    })
    .then(() => {
      console.log("✅ Tax rate set for current year");
      console.log("🎉 VehicleTax contract deployment completed!");
    })
    .catch(error => {
      console.error("❌ Deployment failed:", error);
      throw error;
    });
};
