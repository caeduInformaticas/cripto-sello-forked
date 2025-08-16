const hre = require("hardhat");

async function main() {
  // Obtener las cuentas de Hardhat
  const [deployer, account1, account2, account3] = await hre.ethers.getSigners();

  // Dirección del contrato desplegado (cambiar por la real)
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  // Conectar al contrato
  const CriptoSello = await hre.ethers.getContractFactory("CriptoSello");
  const criptoSello = CriptoSello.attach(CONTRACT_ADDRESS);

  console.log("🏛️  Configurando roles en CriptoSello...");
  console.log("📄 Contrato:", CONTRACT_ADDRESS);
  console.log("👑 Owner:", deployer.address);

  // Mostrar cuentas disponibles
  console.log("\n📋 Cuentas disponibles:");
  console.log("  Cuenta #0 (Deployer/Owner):", deployer.address);
  console.log("  Cuenta #1:", account1.address);
  console.log("  Cuenta #2:", account2.address);
  console.log("  Cuenta #3:", account3.address);

  try {
    // Agregar cuenta #0 como notario (la que estás usando)
    console.log("\n📝 Agregando cuenta #0 como notario...");
    const addNotaryTx = await criptoSello.addNotary(deployer.address);
    await addNotaryTx.wait();
    console.log("✅ Cuenta #0 es ahora notario");

    // Agregar cuenta #1 como notario adicional
    console.log("\n📝 Agregando cuenta #1 como notario...");
    const addNotaryTx2 = await criptoSello.addNotary(account1.address);
    await addNotaryTx2.wait();
    console.log("✅ Cuenta #1 es ahora notario");

    // Verificar que son notarios
    console.log("\n🔍 Verificando permisos:");
    const isNotary0 = await criptoSello.notaries(deployer.address);
    const isNotary1 = await criptoSello.notaries(account1.address);
    const ddrrAddress = await criptoSello.ddrrAddress();

    console.log(`  Cuenta #0 es notario: ${isNotary0}`);
    console.log(`  Cuenta #1 es notario: ${isNotary1}`);
    console.log(`  Dirección DDRR: ${ddrrAddress}`);

    console.log("\n🎉 ¡Configuración completada!");
    console.log("\n📋 Resumen:");
    console.log("  - Cuenta #0 puede crear propiedades (notario)");
    console.log("  - Cuenta #1 puede crear propiedades (notario)");
    console.log("  - Owner puede registrar oficialmente (DDRR)");

  } catch (error) {
    console.error("❌ Error configurando roles:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
