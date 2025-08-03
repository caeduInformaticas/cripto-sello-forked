import { ethers } from 'ethers';
import CriptoSelloABI from './CriptoSello.json';

const CONTRACT_ADDRESS = '0x402902C930ef1ce9B1aba964497b61aE1Da03db7';

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.readOnlyContract = null;
    this.isConnected = false;
    
    // Inicializar contratos automáticamente
    this.init();
  }

  // Inicialización inteligente - prioriza MetaMask, luego RPC público
  async init() {
    // 1. Primero intentar auto-conectar MetaMask si ya hay permisos
    await this.tryAutoConnectWallet();
    
    // 2. Si no hay MetaMask conectada, inicializar contrato de solo lectura como fallback
    if (!this.contract) {
      await this.initReadOnlyContract();
    }

    // 3. Configurar listeners para cambios en MetaMask
    this.setupWalletListeners();
  }

  // Configurar listeners para cambios en la wallet
  setupWalletListeners() {
    if (typeof window.ethereum !== 'undefined') {
      // Listener para cambios de cuenta
      window.ethereum.on('accountsChanged', async (accounts) => {
        console.log('🔄 Cambio de cuenta detectado:', accounts);
        
        if (accounts.length === 0) {
          // Usuario desconectó la wallet
          console.log('⚠️ Wallet desconectada');
          this.isConnected = false;
          this.contract = null;
          this.signer = null;
          this.provider = null;
          
          // Reinicializar contrato de solo lectura
          await this.initReadOnlyContract();
        } else {
          // Usuario cambió de cuenta, reconectar automáticamente
          console.log('🔄 Cuenta cambiada, reconectando...');
          await this.tryAutoConnectWallet();
        }
      });

      // Listener para cambios de red
      window.ethereum.on('chainChanged', async (chainId) => {
        console.log('🔄 Cambio de red detectado:', chainId);
        // Reinicializar conexión cuando cambia la red
        await this.tryAutoConnectWallet();
      });

      console.log('✅ Listeners de MetaMask configurados');
    }
  }

  // Intentar auto-conectar MetaMask si ya hay permisos previos
  async tryAutoConnectWallet() {
    try {
      if (typeof window.ethereum !== 'undefined') {
        // Verificar si ya hay cuentas conectadas (sin solicitar permisos)
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        if (accounts.length > 0) {
          console.log('🔄 Detectada wallet previamente conectada, auto-conectando...');
          
          // Crear proveedor y signer
          this.provider = new ethers.BrowserProvider(window.ethereum);
          this.signer = await this.provider.getSigner();
          
          // Crear instancia del contrato CON SIGNER (para transacciones y consultas)
          this.contract = new ethers.Contract(
            CONTRACT_ADDRESS,
            CriptoSelloABI,
            this.signer
          );
          
          this.isConnected = true;
          const address = await this.signer.getAddress();
          console.log(`✅ Wallet auto-conectada: ${address}`);
          console.log('✅ Contrato listo para transacciones y consultas');
          
          return address;
        } else {
          console.log('ℹ️ No hay wallet previamente conectada');
        }
      } else {
        console.log('ℹ️ MetaMask no disponible');
      }
    } catch (error) {
      console.warn('⚠️ Error en auto-conexión de wallet:', error.message);
    }
    return null;
  }

  // Inicializar contrato de solo lectura como fallback (sin necesidad de wallet)
  async initReadOnlyContract() {
    // Solo inicializar si no tenemos ya un contrato con signer
    if (this.contract) {
      console.log('ℹ️ Ya hay contrato con signer disponible, omitiendo readonly fallback');
      return;
    }

    console.log('🔄 Inicializando contrato de solo lectura como fallback...');
    
    // Lista de proveedores RPC públicos para Mumbai testnet (sin API key requerida)
    const publicRPCs = [
      'https://rpc-mumbai.maticvigil.com/',
      'https://matic-mumbai.chainstacklabs.com',
      'https://rpc-mumbai.matic.today',
      'https://matic-testnet-archive-rpc.bwarelabs.com'
    ];

    // Intentar conectar con cada RPC hasta encontrar uno que funcione
    for (const rpcUrl of publicRPCs) {
      try {
        console.log(`Intentando conectar con RPC: ${rpcUrl}`);
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        
        // Probar la conexión haciendo una llamada simple
        await provider.getNetwork();
        
        this.readOnlyContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CriptoSelloABI,
          provider
        );
        
        console.log(`✅ Contrato de solo lectura inicializado con: ${rpcUrl}`);
        console.log('ℹ️ Solo consultas disponibles - Conecta wallet para transacciones');
        return; // Salir del bucle si funciona
      } catch (error) {
        console.warn(`❌ Falló RPC ${rpcUrl}:`, error.message);
        continue; // Intentar con el siguiente RPC
      }
    }

    // Si todos los RPCs públicos fallan
    console.error('❌ Todos los RPCs públicos fallaron');
    this.readOnlyContract = null;
  }

  // Obtener el contrato apropiado según la operación
  getContract(requireSigner = false) {
    if (requireSigner) {
      if (!this.contract || !this.isConnected) {
        throw new Error('Wallet no conectada. Conecta tu wallet para realizar transacciones.');
      }
      return this.contract;
    } else {
      // Para operaciones de solo lectura, priorizar contract con signer, luego readonly
      return this.contract || this.readOnlyContract;
    }
  }

  // Verificar si la wallet está conectada actualmente
  async getConnectedAccount() {
    if (this.isConnected && this.signer) {
      try {
        return await this.signer.getAddress();
      } catch (error) {
        console.warn('Error obteniendo dirección:', error);
        // Si hay error, la conexión puede haberse perdido
        this.isConnected = false;
        this.contract = null;
        return null;
      }
    }
    return null;
  }

  // Verificar y mantener la conexión de wallet
  async checkWalletConnection() {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        if (accounts.length > 0 && !this.isConnected) {
          // Hay cuentas pero no estamos conectados, auto-reconectar
          console.log('🔄 Detectada desconexión, intentando reconectar...');
          await this.tryAutoConnectWallet();
        } else if (accounts.length === 0 && this.isConnected) {
          // No hay cuentas pero estamos marcados como conectados, limpiar estado
          console.log('⚠️ Wallet desconectada, limpiando estado...');
          this.isConnected = false;
          this.contract = null;
          this.signer = null;
          this.provider = null;
          
          // Reinicializar contrato de solo lectura como fallback
          await this.initReadOnlyContract();
        }
        
        return accounts.length > 0;
      }
    } catch (error) {
      console.warn('Error verificando conexión de wallet:', error);
    }
    return false;
  }


  // Conectar a MetaMask manualmente (cuando el usuario hace clic)
  async connectWallet() {
    try {
      if (typeof window.ethereum !== 'undefined') {
        console.log('🔄 Conectando wallet manualmente...');
        
        // Solicitar acceso a las cuentas
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Crear proveedor y signer
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        
        // Crear instancia del contrato CON SIGNER (reemplaza el readonly si existía)
        this.contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CriptoSelloABI,
          this.signer
        );
        
        this.isConnected = true;
        const address = await this.signer.getAddress();
        
        console.log(`✅ Wallet conectada manualmente: ${address}`);
        console.log('✅ Contrato actualizado para transacciones y consultas');
        
        // Limpiar el contrato de solo lectura ya que ahora tenemos uno mejor
        this.readOnlyContract = null;
        
        return address;
      } else {
        throw new Error('MetaMask no está instalado');
      }
    } catch (error) {
      console.error('Error conectando wallet:', error);
      throw error;
    }
  }

  // Mint (solo notaría) - mintea propiedad y retorna tokenId
  async mintProperty(to, documentId, uri) {
    const contract = this.getContract(true); // Requiere signer
    try {
      console.log('Calling mintProperty with:', { to, documentId, uri });
      
      // Llamar al método mint del contrato que ahora retorna el tokenId directamente
      const tx = await contract.mintProperty(to, documentId, uri);
      const receipt = await tx.wait();

      // El método mintProperty ahora retorna el tokenId, así que podemos obtenerlo de los eventos
      // Buscar el evento Transfer para obtener el tokenId
      const transferEvent = receipt.logs
        .map(log => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find(log => log && log.name === 'Transfer');
      
      const tokenId = transferEvent ? transferEvent.args.tokenId.toString() : null;

      if (!tokenId) {
        throw new Error('No se pudo obtener el tokenId del evento Transfer');
      }

      console.log('Property minted successfully:', { tokenId, txHash: tx.hash });
      return { tx, tokenId };
    } catch (error) {
      console.error('Error minteando propiedad:', error);
      throw error;
    }
  }

  // Validar propiedad (solo notaría)
  async validateProperty(tokenId) {
    const contract = this.getContract(true); // Requiere signer
    try {
      // Validar y convertir tokenId de forma segura
      const validTokenId = tokenId.toString();
      
      console.log(`🔍 Validando propiedad con Token ID: ${validTokenId} (original: ${tokenId})`);

      const tx = await contract.validateProperty(validTokenId);
      await tx.wait();
      
      console.log(`✅ Propiedad ${validTokenId} validada exitosamente`);
      return tx;
    } catch (error) {
      console.error('Error validando propiedad:', error);
      
      // Proporcionar mensajes más específicos
      if (error.message.includes('Token ID inválido') || error.message.includes('Token ID demasiado grande')) {
        // Re-lanzar errores de validación personalizados
        throw error;
      } else if (error.message.includes('overflow')) {
        throw new Error(`Token ID demasiado grande o inválido: ${tokenId}. Debe ser un número entero pequeño (ej: 1, 2, 3).`);
      }
      
      throw error;
    }
  }

  // Registrar propiedad (solo DDRR)
  async registerProperty(tokenId, newUri) {
    const contract = this.getContract(true); // Requiere signer
    try {
      // Validar y convertir tokenId de forma segura
      const validTokenId = this.validateTokenId(tokenId);
      
      console.log(`🔍 Registrando propiedad con Token ID: ${validTokenId}`);
      
      const tx = await contract.registerProperty(validTokenId, newUri);
      await tx.wait();
      
      console.log(`✅ Propiedad ${validTokenId} registrada exitosamente`);
      return tx;
    } catch (error) {
      console.error('Error registrando propiedad:', error);
      throw error;
    }
  }

  // Método auxiliar para validar TokenID
  validateTokenId(tokenId) {
    let validTokenId;
    
    if (typeof tokenId === 'string') {
      validTokenId = parseInt(tokenId);
    } else if (typeof tokenId === 'number') {
      validTokenId = Math.floor(tokenId);
    } else {
      throw new Error(`Token ID inválido: ${tokenId}. Debe ser un número entero.`);
    }

    if (isNaN(validTokenId) || validTokenId < 0) {
      throw new Error(`Token ID inválido: ${tokenId}. Debe ser un número positivo.`);
    }

    if (validTokenId > Number.MAX_SAFE_INTEGER) {
      throw new Error(`Token ID demasiado grande: ${tokenId}. Máximo permitido: ${Number.MAX_SAFE_INTEGER}`);
    }

    return validTokenId;
  }

  // Consultar propiedad (solo lectura - no requiere wallet)
  async getPropertyInfo(tokenId) {
    const contract = this.getContract(false); // No requiere signer
    if (!contract) {
      throw new Error('No se puede conectar al contrato. Verifica tu conexión a internet o conecta tu wallet.');
    }
    
    try {
      // Validar y convertir tokenId de forma segura
      
      const tokenIdBigInt = tokenId.toString();
      const data = await contract.getPropertyInfo(tokenIdBigInt);
      return {
        owner: data[0],
        state: Number(data[1]),  // Convertir a número para el enum
        uri: data[2],
      };
    } catch (error) {
      console.error('Error consultando propiedad:', error);
      
      // Proporcionar mensajes más específicos
      if (error.message.includes('Token ID inválido') || error.message.includes('Token ID demasiado grande')) {
        // Re-lanzar errores de validación personalizados
        throw error;
      } else if (error.message.includes('overflow')) {
        throw new Error(`Token ID demasiado grande o inválido: ${tokenId}. Debe ser un número entero pequeño (ej: 1, 2, 3).`);
      } else if (error.message.includes('nonexistent token') || error.message.includes('ERC721NonexistentToken')) {
        throw new Error(`El token ID ${tokenId} no existe en el contrato.`);
      } else if (error.message.includes('403') || error.message.includes('API key')) {
        throw new Error('Error de RPC: El proveedor requiere autenticación. Reconectando...');
      } else if (error.message.includes('network') || error.message.includes('SERVER_ERROR')) {
        throw new Error('Error de red o RPC. Verifica tu conexión a internet.');
      } else if (error.message.includes('revert')) {
        throw new Error(`Error del contrato: El token ${tokenId} no es válido o no existe.`);
      } else if (error.code === 'SERVER_ERROR') {
        throw new Error('Error del servidor RPC. Reintentando con otro proveedor...');
      }
      
      throw new Error(`Error consultando propiedad: ${error.message}`);
    }
  }

  // Propietario de un token (solo lectura)
  async getOwnerOf(tokenId) {
    const contract = this.getContract(false); // No requiere signer
    if (!contract) {
      throw new Error('No se puede conectar al contrato. Verifica tu conexión a internet o conecta tu wallet.');
    }
    
    try {
      return await contract.ownerOf(tokenId);
    } catch (error) {
      if (error.message.includes('nonexistent token') || error.message.includes('ERC721NonexistentToken')) {
        throw new Error(`El token ID ${tokenId} no existe.`);
      }
      throw error;
    }
  }

  // Obtener estados legibles según el nuevo enum
  getPropertyStateText(state) {
    const states = {
      0: 'En Notaría',      // IN_NOTARY
      1: 'Validado',        // VALIDATED
      2: 'Registrado'       // REGISTERED
    };
    return states[state] || 'Desconocido';
  }

  // Verificar si el servicio puede realizar consultas
  canQuery() {
    return !!(this.contract || this.readOnlyContract);
  }

  // Verificar si el servicio puede realizar transacciones
  canTransact() {
    return !!(this.contract && this.isConnected);
  }

  // Obtener información del estado del servicio
  getServiceStatus() {
    return {
      hasWallet: this.isConnected,
      canQuery: this.canQuery(),
      canTransact: this.canTransact(),
      walletAddress: this.isConnected ? 'Conectada' : 'No conectada',
      contractAddress: CONTRACT_ADDRESS,
      readOnlyAvailable: !!this.readOnlyContract,
      contractType: this.contract ? 'Con Signer (Transacciones + Consultas)' : 
                   this.readOnlyContract ? 'Solo Lectura (Solo Consultas)' : 'No Disponible'
    };
  }

  // Método para reintentar inicialización completa
  async retryInit() {
    console.log('🔄 Reintentando inicialización completa...');
    await this.init();
    return this.canQuery();
  }

  // Método para reintentar inicialización del contrato de solo lectura
  async retryReadOnlyInit() {
    console.log('🔄 Reintentando inicialización del contrato...');
    // Primero intentar auto-conectar wallet, luego fallback a readonly
    await this.init();
    return this.canQuery();
  }

  // Método para obtener información sobre los RPCs disponibles
  getRPCStatus() {
    return {
      hasReadOnlyContract: !!this.readOnlyContract,
      hasWalletContract: !!this.contract,
      canQuery: this.canQuery(),
      canTransact: this.canTransact(),
      usingMetaMask: this.isConnected
    };
  }

  // Método para probar la conectividad de un RPC específico
  async testRPCConnection(rpcUrl) {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      await provider.getNetwork();
      return { success: true, rpc: rpcUrl };
    } catch (error) {
      return { success: false, rpc: rpcUrl, error: error.message };
    }
  }
}

// Exportar una instancia singleton
const blockchainService = new BlockchainService();
export default blockchainService;
