import { ethers } from "hardhat";
import { utils } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { expect } from "chai";

const TOTAL_SUPPLY = utils.parseEther("100000000", 18);
describe("ERC20", function () {
  let token: ERC20;

  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let spender: SignerWithAddress;

  before(async () => {
    [owner, alice, spender] = await ethers.getSigners();
  })

  beforeEach(async () => {
    const ERC20 = await ethers.getContractFactory("ERC20");
    token = await ERC20.deploy();
  });

  describe("initialized states", function () {
    it("sets config correctly", async function () {
      expect(await token.name()).to.equal("ERC20");
      expect(await token.symbol()).to.equal("ERC20");
      expect(await token.decimals()).to.equal(18);
      expect(await token.totalSupply()).to.equal(TOTAL_SUPPLY);
    })

    it("mints 100mil tokens to owner", async function () {
      expect(await token.balanceOf(owner.address)).to.equal(TOTAL_SUPPLY);
    });
  })

  describe("#transfer", function () {
    it("reverts on insufficient balance", async () => {
      await expect(token.connect(alice).transfer(owner.address, 1)).to.be.revertedWith("ERC20: balance exceeded")
    })

    it("transfers successfully", async () => {
      await expect(token.transfer(alice.address, 1))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, alice.address, 1);
      expect(await token.balanceOf(alice.address)).to.eq(1)
      expect(await token.balanceOf(owner.address)).to.eq(TOTAL_SUPPLY.sub(1))
    })
  })

  describe("#approve", function () {
    it("approves successfully and changes allowance", async () => {
      await expect(token.approve(spender.address, 100))
        .to.emit(token, "Approval")
        .withArgs(owner.address, spender.address, 100);
      expect(await token.allowance(owner.address, spender.address)).to.eq(100)
      expect(await token.allowance(owner.address, alice.address)).to.eq(0)
    })
  })

  describe("#transferFrom", function () {
    it("reverts on insufficient allowance", async () => {
      await expect(token.connect(spender).transferFrom(owner.address, alice.address, 1)).to.be.revertedWith("ERC20: insufficient allowance")
    })

    it("reverts on insufficient balance", async () => {
      await token.connect(alice).approve(spender.address, 100)
      expect(await token.allowance(alice.address, spender.address)).to.eq(100)
      await expect(token.connect(spender).transferFrom(alice.address, owner.address, 1)).to.be.revertedWith("ERC20: balance exceeded")
    })

    it("transfers successfully", async () => {
      await token.approve(spender.address, 100)
      expect(await token.allowance(owner.address, spender.address)).to.eq(100)

      await token.connect(spender).transferFrom(owner.address, alice.address, 1)
      expect(await token.balanceOf(alice.address)).to.eq(1)
      expect(await token.balanceOf(owner.address)).to.eq(TOTAL_SUPPLY.sub(1))
    })
  })
})
