const { deployContractsFixture } = require("./lib/fixtures");
const ERC721 = require("../openzeppelin/test/token/ERC721/ERC721.test.js");

ERC721(deployContractsFixture);