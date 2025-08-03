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
  async mintProperty(to, documentId, uri) {
    if (!this.contract) throw new Error('Contrato no inicializado');
    try {
      console.log('Calling mintProperty with:', { to, documentId, uri });
      
      // Llamar al método mint del contrato que ahora retorna el tokenId directamente
      const tx = await this.contract.mintProperty(to, documentId, uri);
      const receipt = await tx.wait();

      // El método mintProperty ahora retorna el tokenId, así que podemos obtenerlo de los eventos
      // Buscar el evento Transfer para obtener el tokenId
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

  // Generar tokenId de forma local (para validación previa)
  async generateTokenId(to, documentId, uri) {
    if (!this.contract) throw new Error('Contrato no inicializado');
    try {
      // Usar la misma lógica que el contrato para generar el tokenId
      const encoded = ethers.solidityPacked(
        ['address', 'uint256', 'string'],
        [to, documentId, uri]
      );
      const hash = ethers.keccak256(encoded);
      return ethers.toBigInt(hash).toString();
    } catch (error) {
      console.error('Error generando tokenId:', error);
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
        state: Number(data[1]),  // Convertir a número para el enum
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

  // Obtener estados legibles según el nuevo enum
  getPropertyStateText(state) {
    const states = {
      0: 'En Notaría',      // IN_NOTARY
      1: 'Validado',        // VALIDATED
      2: 'Registrado'       // REGISTERED
    };
    return states[state] || 'Desconocido';
  }

  // Verificar si existe una propiedad
  async propertyExists(tokenId) {
    try {
      await this.contract.ownerOf(tokenId);
      return true;
    } catch {
      return false;
    }
  }
}

// Exportar una instancia singleton
const blockchainService = new BlockchainService();
export default blockchainService;
