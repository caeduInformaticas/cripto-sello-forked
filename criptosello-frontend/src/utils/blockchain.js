import { ethers } from 'ethers';
import CriptoSelloABI from './CriptoSello.json';

// Configuración del contrato
const CONTRACT_ADDRESS = '0x0864B645Bdc3501326ea698F34CA9BF88d58B3f9';
const RPC_URL = 'http://localhost:8545';

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.isConnected = false;
  }

  // Conectar a MetaMask o proveedor web3
  async connectWallet() {
    try {
      if (typeof window.ethereum !== 'undefined') {
        // Solicitar acceso a las cuentas
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Crear proveedor y signer
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        
        // Crear instancia del contrato
        this.contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CriptoSelloABI.abi,
          this.signer
        );
        
        this.isConnected = true;
        return await this.signer.getAddress();
      } else {
        throw new Error('MetaMask no está instalado');
      }
    } catch (error) {
      console.error('Error conectando wallet:', error);
      throw error;
    }
  }

  // Conectar al nodo local de Hardhat (para desarrollo)
  async connectToLocalNode() {
    try {
      this.provider = new ethers.JsonRpcProvider(RPC_URL);
      
      // Usar la primera cuenta del nodo local
      const accounts = await this.provider.listAccounts();
      if (accounts.length > 0) {
        this.signer = accounts[0];
      } else {
        // Crear un signer con una clave privada conocida del nodo local
        this.signer = new ethers.Wallet(
          '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
          this.provider
        );
      }
      
      this.contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CriptoSelloABI.abi,
        this.signer
      );
      
      this.isConnected = true;
      return await this.signer.getAddress();
    } catch (error) {
      console.error('Error conectando al nodo local:', error);
      throw error;
    }
  }

  // Obtener la dirección de la cuenta conectada
  async getAccount() {
    if (!this.signer) {
      throw new Error('Wallet no conectado');
    }
    return await this.signer.getAddress();
  }

  // Crear una nueva propiedad (solo notarios)
  async createProperty(to, tokenId, ownerInfo, details, legalDocsHash) {
    if (!this.contract) {
      throw new Error('Contrato no inicializado');
    }
    
    try {
      const tx = await this.contract.createProperty(
        to,
        tokenId,
        ownerInfo,
        details,
        legalDocsHash
      );
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error creando propiedad:', error);
      throw error;
    }
  }

  // Validar una propiedad (solo notarios)
  async validateProperty(tokenId) {
    if (!this.contract) {
      throw new Error('Contrato no inicializado');
    }
    
    try {
      const tx = await this.contract.validateProperty(tokenId);
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error validando propiedad:', error);
      throw error;
    }
  }

  // Registrar una propiedad (solo DDRR)
  async registerProperty(tokenId) {
    if (!this.contract) {
      throw new Error('Contrato no inicializado');
    }
    
    try {
      const tx = await this.contract.registerProperty(tokenId);
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error registrando propiedad:', error);
      throw error;
    }
  }

  // Obtener información de una propiedad
  async getProperty(tokenId) {
    if (!this.contract) {
      throw new Error('Contrato no inicializado');
    }
    
    try {
      const property = await this.contract.getProperty(tokenId);
      return {
        ownerInfo: property[0],
        details: property[1],
        legalDocsHash: property[2],
        state: property[3]
      };
    } catch (error) {
      console.error('Error obteniendo propiedad:', error);
      throw error;
    }
  }

  // Obtener el propietario de un token
  async getOwnerOf(tokenId) {
    if (!this.contract) {
      throw new Error('Contrato no inicializado');
    }
    
    try {
      return await this.contract.ownerOf(tokenId);
    } catch (error) {
      console.error('Error obteniendo propietario:', error);
      throw error;
    }
  }

  // Agregar un notario (solo owner del contrato)
  async addNotary(notaryAddress) {
    if (!this.contract) {
      throw new Error('Contrato no inicializado');
    }
    
    try {
      const tx = await this.contract.addNotary(notaryAddress);
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error agregando notario:', error);
      throw error;
    }
  }

  // Verificar si una dirección es notario
  async isNotary(address) {
    if (!this.contract) {
      throw new Error('Contrato no inicializado');
    }
    
    try {
      return await this.contract.notaries(address);
    } catch (error) {
      console.error('Error verificando notario:', error);
      throw error;
    }
  }

  // Obtener la dirección DDRR
  async getDDRRAddress() {
    if (!this.contract) {
      throw new Error('Contrato no inicializado');
    }
    
    try {
      return await this.contract.ddrrAddress();
    } catch (error) {
      console.error('Error obteniendo dirección DDRR:', error);
      throw error;
    }
  }

  // Escuchar eventos del contrato
  onPropertyRegistered(callback) {
    if (!this.contract) {
      throw new Error('Contrato no inicializado');
    }
    
    this.contract.on('PropertyRegistered', callback);
  }

  onPropertyStateChanged(callback) {
    if (!this.contract) {
      throw new Error('Contrato no inicializado');
    }
    
    this.contract.on('PropertyStateChanged', callback);
  }

  // Limpiar listeners
  removeAllListeners() {
    if (this.contract) {
      this.contract.removeAllListeners();
    }
  }

  // Estados de propiedad
  getPropertyStates() {
    return {
      IN_NOTARY: 0,
      VALIDATED: 1,
      REGISTERED: 2
    };
  }

  getPropertyStateText(state) {
    const states = {
      0: 'En Notaría',
      1: 'Validado',
      2: 'Registrado'
    };
    return states[state] || 'Desconocido';
  }
}

// Exportar una instancia singleton
const blockchainService = new BlockchainService();
export default blockchainService;

