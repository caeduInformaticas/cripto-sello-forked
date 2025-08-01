const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CriptoSello", function () {
  let criptoSello;
  let owner;
  let notary;
  let ddrr;
  let user;
  let addrs;

  beforeEach(async function () {
    [owner, notary, ddrr, user, ...addrs] = await ethers.getSigners();

    const CriptoSello = await ethers.getContractFactory("CriptoSello");
    criptoSello = await CriptoSello.deploy(ddrr.address);
    await criptoSello.waitForDeployment();

    // Agregar notario
    await criptoSello.addNotary(notary.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await criptoSello.owner()).to.equal(owner.address);
    });

    it("Should set the right DDRR address", async function () {
      expect(await criptoSello.ddrrAddress()).to.equal(ddrr.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await criptoSello.name()).to.equal("CriptoSelloProperty");
      expect(await criptoSello.symbol()).to.equal("CSP");
    });
  });

  describe("Notary Management", function () {
    it("Should add notary correctly", async function () {
      expect(await criptoSello.notaries(notary.address)).to.be.true;
    });

    it("Should remove notary correctly", async function () {
      await criptoSello.removeNotary(notary.address);
      expect(await criptoSello.notaries(notary.address)).to.be.false;
    });

    it("Should only allow owner to add notaries", async function () {
      await expect(
        criptoSello.connect(user).addNotary(user.address)
      ).to.be.revertedWithCustomError(criptoSello, "OwnableUnauthorizedAccount");
    });
  });

  describe("Property Creation", function () {
    it("Should create property correctly", async function () {
      const tokenId = 1;
      const ownerInfo = "Juan Pérez - CI: 12345678";
      const details = "Casa de 2 pisos, 150m², Zona Sur, La Paz";
      const legalDocsHash = "QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

      await expect(
        criptoSello.connect(notary).createProperty(
          user.address,
          tokenId,
          ownerInfo,
          details,
          legalDocsHash
        )
      ).to.emit(criptoSello, "PropertyRegistered")
        .withArgs(tokenId, user.address, ownerInfo, details, legalDocsHash);

      // Verificar que el token fue creado
      expect(await criptoSello.ownerOf(tokenId)).to.equal(user.address);

      // Verificar los datos de la propiedad
      const property = await criptoSello.getProperty(tokenId);
      expect(property.ownerInfo).to.equal(ownerInfo);
      expect(property.details).to.equal(details);
      expect(property.legalDocsHash).to.equal(legalDocsHash);
      expect(property.state).to.equal(0); // IN_NOTARY
    });

    it("Should only allow notaries to create properties", async function () {
      await expect(
        criptoSello.connect(user).createProperty(
          user.address,
          1,
          "Test Owner",
          "Test Details",
          "Test Hash"
        )
      ).to.be.revertedWith("Caller is not a notary");
    });

    it("Should not allow duplicate token IDs", async function () {
      const tokenId = 1;
      
      await criptoSello.connect(notary).createProperty(
        user.address,
        tokenId,
        "Owner 1",
        "Details 1",
        "Hash 1"
      );

      await expect(
        criptoSello.connect(notary).createProperty(
          addrs[0].address,
          tokenId,
          "Owner 2",
          "Details 2",
          "Hash 2"
        )
      ).to.be.revertedWith("Property already exists");
    });
  });

  describe("Property Validation", function () {
    beforeEach(async function () {
      await criptoSello.connect(notary).createProperty(
        user.address,
        1,
        "Test Owner",
        "Test Details",
        "Test Hash"
      );
    });

    it("Should validate property correctly", async function () {
      await expect(
        criptoSello.connect(notary).validateProperty(1)
      ).to.emit(criptoSello, "PropertyStateChanged")
        .withArgs(1, 1); // VALIDATED

      const property = await criptoSello.getProperty(1);
      expect(property.state).to.equal(1); // VALIDATED
    });

    it("Should only allow notaries to validate", async function () {
      await expect(
        criptoSello.connect(user).validateProperty(1)
      ).to.be.revertedWith("Caller is not a notary");
    });

    it("Should not validate non-existent property", async function () {
      await expect(
        criptoSello.connect(notary).validateProperty(999)
      ).to.be.revertedWith("Property does not exist");
    });

    it("Should only validate properties in IN_NOTARY state", async function () {
      // Validar primero
      await criptoSello.connect(notary).validateProperty(1);
      
      // Intentar validar de nuevo
      await expect(
        criptoSello.connect(notary).validateProperty(1)
      ).to.be.revertedWith("Property is not in IN_NOTARY state");
    });
  });

  describe("Property Registration", function () {
    beforeEach(async function () {
      await criptoSello.connect(notary).createProperty(
        user.address,
        1,
        "Test Owner",
        "Test Details",
        "Test Hash"
      );
      await criptoSello.connect(notary).validateProperty(1);
    });

    it("Should register property correctly", async function () {
      await expect(
        criptoSello.connect(ddrr).registerProperty(1)
      ).to.emit(criptoSello, "PropertyStateChanged")
        .withArgs(1, 2); // REGISTERED

      const property = await criptoSello.getProperty(1);
      expect(property.state).to.equal(2); // REGISTERED
    });

    it("Should only allow DDRR to register", async function () {
      await expect(
        criptoSello.connect(user).registerProperty(1)
      ).to.be.revertedWith("Caller is not DDRR");
    });

    it("Should only register validated properties", async function () {
      // Crear nueva propiedad sin validar
      await criptoSello.connect(notary).createProperty(
        user.address,
        2,
        "Test Owner 2",
        "Test Details 2",
        "Test Hash 2"
      );

      await expect(
        criptoSello.connect(ddrr).registerProperty(2)
      ).to.be.revertedWith("Property is not in VALIDATED state");
    });
  });

  describe("Property Queries", function () {
    beforeEach(async function () {
      await criptoSello.connect(notary).createProperty(
        user.address,
        1,
        "Test Owner",
        "Test Details",
        "Test Hash"
      );
    });

    it("Should return property information correctly", async function () {
      const property = await criptoSello.getProperty(1);
      expect(property.ownerInfo).to.equal("Test Owner");
      expect(property.details).to.equal("Test Details");
      expect(property.legalDocsHash).to.equal("Test Hash");
      expect(property.state).to.equal(0); // IN_NOTARY
    });

    it("Should not return non-existent property", async function () {
      await expect(
        criptoSello.getProperty(999)
      ).to.be.revertedWith("Property does not exist");
    });

    it("Should return correct owner", async function () {
      expect(await criptoSello.ownerOf(1)).to.equal(user.address);
    });
  });

  describe("Access Control", function () {
    it("Should have correct initial roles", async function () {
      expect(await criptoSello.owner()).to.equal(owner.address);
      expect(await criptoSello.ddrrAddress()).to.equal(ddrr.address);
      expect(await criptoSello.notaries(notary.address)).to.be.true;
    });

    it("Should transfer ownership correctly", async function () {
      await criptoSello.transferOwnership(user.address);
      expect(await criptoSello.owner()).to.equal(user.address);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle empty strings in property creation", async function () {
      await expect(
        criptoSello.connect(notary).createProperty(
          user.address,
          1,
          "",
          "",
          ""
        )
      ).to.not.be.reverted;

      const property = await criptoSello.getProperty(1);
      expect(property.ownerInfo).to.equal("");
      expect(property.details).to.equal("");
      expect(property.legalDocsHash).to.equal("");
    });

    it("Should handle zero address in property creation", async function () {
      await expect(
        criptoSello.connect(notary).createProperty(
          ethers.ZeroAddress,
          1,
          "Test Owner",
          "Test Details",
          "Test Hash"
        )
      ).to.be.revertedWithCustomError(criptoSello, "ERC721InvalidReceiver");
    });
  });
});

