const fs = require('fs');

async function main() {
  const Voting = await ethers.getContractFactory('Voting');
  const voting = await Voting.deploy();
  // ethers v6: contract is deployed after deploy() resolves
  console.log('Voting deployed to:', voting.target);

  // Save contract address
  fs.writeFileSync('deployed-address.txt', voting.target);

  // Save ABI
  const artifact = await hre.artifacts.readArtifact('Voting');
  fs.writeFileSync('Voting-abi.json', JSON.stringify(artifact.abi, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 