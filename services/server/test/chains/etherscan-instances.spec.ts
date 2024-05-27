// Periodical tests of Import from Etherscan for each instance e.g. Arbiscan, Etherscan, Bscscan, etc.

import testContracts from "../helpers/etherscanInstanceContracts.json";
import {
  sourcifyChainsMap,
  sourcifyChainsArray,
} from "../../src/sourcify-chains";
import { verifyAndAssertEtherscan } from "../helpers/helpers";
import chai from "chai";
import { ServerFixture } from "../helpers/ServerFixture";

const CUSTOM_PORT = 5679;

describe("Test each Etherscan instance", function () {
  const serverFixture = new ServerFixture({
    port: CUSTOM_PORT,
  });

  const testedChains: number[] = [];
  let chainId: keyof typeof testContracts;
  for (chainId in testContracts) {
    if (!sourcifyChainsMap[chainId].supported) {
      throw new Error(
        `Unsupported chain (${chainId}) found in test configuration`
      );
    }
    if (process.env.TEST_CHAIN && process.env.TEST_CHAIN !== chainId) continue;
    testedChains.push(parseInt(chainId));
    describe(`#${chainId} ${sourcifyChainsMap[chainId].name}`, () => {
      testContracts[chainId].forEach((contract) => {
        const address = contract.address;
        const expectedStatus = contract.expectedStatus;
        const type = contract.type;
        const chain = chainId;
        it(`Non-Session: Should import a ${type} contract from ${sourcifyChainsMap[chain].etherscanApi?.apiURL} and verify the contract, finding a ${expectedStatus} match`, (done) => {
          verifyAndAssertEtherscan(
            serverFixture,
            chain,
            address,
            expectedStatus,
            done
          );
        });
      });
    });
  }
  describe("Double check that all supported chains are tested", () => {
    const supportedEtherscanChains = sourcifyChainsArray.filter(
      (chain) => chain.etherscanApi && chain.supported
    );

    it("should have tested all supported chains", function (done) {
      const untestedChains = supportedEtherscanChains.filter(
        (chain) => !testedChains.includes(chain.chainId)
      );
      if (process.env.TEST_CHAIN) {
        return this.skip();
      }
      chai.assert(
        untestedChains.length == 0,
        `There are untested supported chains!: ${untestedChains
          .map((chain) => `${chain.name} (${chain.chainId})`)
          .join(", ")}`
      );

      done();
    });
  });
});
