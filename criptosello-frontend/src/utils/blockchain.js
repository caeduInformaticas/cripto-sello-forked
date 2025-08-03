import { ethers } from 'ethers';
import CriptoSelloABI from './CriptoSello.json';

const CONTRACT_ADDRESS = '0x402902C930ef1ce9B1aba964497b61aE1Da03db7';

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
          CriptoSelloABI,
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

  // Mint (solo notaría) - mintea propiedad y retorna tokenId
  async mintProperty(to, uri) {
    if (!this.contract) throw new Error('Contrato no inicializado');
    try {
      const tx = await this.contract.mintProperty(to, uri);
      const receipt = await tx.wait();

      // Extraer el tokenId del evento Transfer (ERC721)
      const transferEvent = receipt.logs
        .map(log => {
          try {
            return this.contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find(log => log && log.name === 'Transfer');
      const tokenId = transferEvent ? transferEvent.args.tokenId.toString() : null;

      return { tx, tokenId };
    } catch (error) {
      console.error('Error minteando propiedad:', error);
      throw error;
    }
  }

  // Validar propiedad (solo notaría)
  async validateProperty(tokenId) {
    if (!this.contract) throw new Error('Contrato no inicializado');
    try {
      const tx = await this.contract.validateProperty(tokenId);
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error validando propiedad:', error);
      throw error;
    }
  }

  // Registrar propiedad (solo DDRR)
  async registerProperty(tokenId, newUri) {
    if (!this.contract) throw new Error('Contrato no inicializado');
    try {
      const tx = await this.contract.registerProperty(tokenId, newUri);
      await tx.wait();
      return tx;
    } catch (error) {
      console.error('Error registrando propiedad:', error);
      throw error;
    }
  }

  // Consultar propiedad
  async getPropertyInfo(tokenId) {
    if (!this.contract) throw new Error('Contrato no inicializado');
    try {
      const data = await this.contract.getPropertyInfo(tokenId);
      return {
        owner: data[0],
        state: data[1],  // 0, 1, 2
        uri: data[2],
      };
    } catch (error) {
      console.error('Error consultando propiedad:', error);
      throw error;
    }
  }

  // Propietario de un token
  async getOwnerOf(tokenId) {
    if (!this.contract) throw new Error('Contrato no inicializado');
    return await this.contract.ownerOf(tokenId);
  }

  // Obtener estados legibles
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
