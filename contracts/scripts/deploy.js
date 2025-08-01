const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const CriptoSello = await hre.ethers.getContractFactory("CriptoSello");
  const criptoSello = await CriptoSello.deploy(deployer.address); // Assuming deployer is also DDRR for simplicity

  await criptoSello.waitForDeployment();

  console.log("CriptoSello deployed to:", criptoSello.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


