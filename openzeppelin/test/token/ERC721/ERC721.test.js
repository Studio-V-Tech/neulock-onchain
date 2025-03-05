const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { shouldBehaveLikeERC721, shouldBehaveLikeERC721Metadata } = require('./ERC721.behavior');

const name = 'Neulock';
const symbol = 'NEU';


module.exports = function (deployContractsFixture) {
  async function fixture() {
    const { neuDeployment } = await deployContractsFixture({ isTest: true });

    return {
      accounts: await ethers.getSigners(),
      token: neuDeployment,
    };
  }

  describe('ERC721', function () {
    beforeEach(async function () {
      Object.assign(this, await loadFixture(fixture));
    });

    shouldBehaveLikeERC721();
    shouldBehaveLikeERC721Metadata(name, symbol);
  });

}
