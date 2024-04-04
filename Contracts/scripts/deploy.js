
const hre = require("hardhat");
const { VRFCOORDINATOR, LINKADDRESS, FEE, KEYHASH } = require("../constants");

async function main() { 
  const contract = await hre.ethers.deployContract("RandomWinnerGame",[
    VRFCOORDINATOR,
    LINKADDRESS,
    FEE,
    KEYHASH
  ])

  await contract.waitForDeployment()


  console.log("Contract Deployed at : ", contract.target);

  await sleep(30000);

  await hre.run("verify:verify",{
    address : contract.target ,
    constructorArguments :[ VRFCOORDINATOR,LINKADDRESS,FEE,KEYHASH]
  })
}

function sleep(ms){
  return new Promise((resolve)=>setTimeout(resolve,ms))
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
