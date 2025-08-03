# Integración CriptoSello con Pinata Cloud

Este proyecto ahora usa **Pinata Cloud** para almacenar archivos en IPFS de manera confiable.

## Cambios Principales

### 1. Formulario Simplificado
- **Carnet de Identidad**: Campo obligatorio (solo números)
- **Descripción**: Campo obligatorio (mínimo 10 caracteres)
- **Documento PDF**: Solo se permite un archivo PDF

### 2. Nuevo Servicio Pinata
- Archivo: `src/services/pinataService.js`
- Soporte para JWT o API Key + Secret
- Modo demo automático si no hay credenciales
- Validación de archivos PDF
- Metadatos compatibles con NFT estándar

### 3. Componentes Actualizados
- `PropertyRegistrationFormSimple.jsx`: Formulario simplificado
- `PDFUploader.jsx`: Subida específica para PDFs
- `PinataSetup.jsx`: Configuración de credenciales

## Configuración

### Variables de Entorno (.env)

```bash
# Opción 1: JWT Token (Recomendado)
VITE_PINATA_JWT=...

# Opción 2: API Key + Secret
VITE_PINATA_API_KEY=tu_api_key
VITE_PINATA_SECRET_API_KEY=tu_secret_key
```

### Obtener Credenciales de Pinata

1. Ve a [pinata.cloud](https://pinata.cloud)
2. Crea una cuenta gratuita
3. Ve a **API Keys** > **Create New Key**
4. Copia el JWT token o API Key + Secret
5. Agrega al archivo `.env`

## Integración con el Contrato

### Datos que se Preparan para el Mint

El formulario prepara un objeto `contractData` con:

```javascript
{
  // Datos para la función mint del contrato
  tokenURI: "ipfs://QmHash...",           // URI de IPFS para metadatos
  carnetIdentidad: "12345678",            // CI del propietario
  description: "Descripción...",          // Descripción de la propiedad
  
  // Información adicional
  metadataHash: "QmMetadataHash...",      // Hash de metadatos en IPFS
  documentHash: "QmDocumentHash...",      // Hash del documento PDF
  documentUrl: "https://gateway.pinata.cloud/ipfs/...", // URL accesible
  
  // Metadatos completos NFT
  metadata: { /* objeto JSON completo */ },
  
  // Estado
  isDemoMode: false                        // true si está en modo demo
}
```

### Función Mint del Contrato (Ejemplo)

```solidity
function mintProperty(
    string memory tokenURI,
    string memory carnetIdentidad,
    string memory description
) public returns (uint256) {
    uint256 tokenId = _tokenIds.current();
    _mint(msg.sender, tokenId);
    _setTokenURI(tokenId, tokenURI);
    
    // Guardar datos específicos
    properties[tokenId] = Property({
        carnetIdentidad: carnetIdentidad,
        description: description,
        owner: msg.sender,
        state: TokenState.IN_NOTARY,
        createdAt: block.timestamp
    });
    
    _tokenIds.increment();
    return tokenId;
}
```

### Implementación en React

```javascript
// En handleRegistrationComplete del PropietarioPanel
const handleRegistrationComplete = async (contractData) => {
  try {
    // Conectar con Web3/Ethers
    const contract = await getContract()
    
    // Llamar función mint
    const tx = await contract.mintProperty(
      contractData.tokenURI,
      contractData.carnetIdentidad,
      contractData.description
    )
    
    // Esperar confirmación
    const receipt = await tx.wait()
    
    console.log('Propiedad minted:', receipt.transactionHash)
    
    // Obtener el tokenId del evento
    const tokenId = receipt.events[0].args.tokenId
    
    // Actualizar UI
    alert(`Propiedad registrada con Token ID: ${tokenId}`)
    
  } catch (error) {
    console.error('Error al mint:', error)
    alert('Error al registrar en blockchain')
  }
}
```

## Estructura de Metadatos NFT

```json
{
  "name": "Propiedad - CI: 12345678",
  "description": "Casa ubicada en...",
  "image": "",
  "attributes": [
    {
      "trait_type": "Carnet de Identidad",
      "value": "12345678"
    },
    {
      "trait_type": "Registration Date",
      "value": "2025-08-03T10:00:00.000Z",
      "display_type": "date"
    },
    {
      "trait_type": "Status",
      "value": "IN_NOTARY"
    }
  ],
  "criptosello": {
    "carnetIdentidad": "12345678",
    "description": "Casa ubicada en...",
    "document": {
      "ipfsHash": "QmDocumentHash...",
      "url": "https://gateway.pinata.cloud/ipfs/...",
      "name": "documento.pdf"
    },
    "createdAt": "2025-08-03T10:00:00.000Z",
    "status": "IN_NOTARY",
    "version": "1.0"
  }
}
```

## Estados del Token

1. **IN_NOTARY** (0): Recién creado, en proceso de notaría
2. **VALIDATED** (1): Validado por notaría
3. **REGISTERED** (2): Registrado oficialmente por DDRR

## Funciones de Actualización

### Para Validación (Notaría)
```javascript
const validationData = {
  notaryAddress: "0x...",
  notes: "Documentos verificados",
  signature: "0x..."
}

const result = await pinataService.updatePropertyForValidation(
  originalMetadataHash, 
  validationData
)

// Llamar función del contrato
await contract.validateProperty(tokenId, result.url)
```

### Para Registro (DDRR)
```javascript
const registrationData = {
  ddrAddress: "0x...",
  notes: "Registro oficial completado",
  signature: "0x..."
}

const result = await pinataService.updatePropertyForRegistration(
  validatedMetadataHash, 
  registrationData
)

// Llamar función del contrato
await contract.registerProperty(tokenId, result.url)
```

## Ventajas de Pinata

1. **Confiabilidad**: Servicio profesional con alta disponibilidad
2. **Velocidad**: Gateways optimizados para acceso rápido
3. **API Simple**: Fácil integración con JavaScript
4. **Metadatos**: Soporte nativo para organización de archivos
5. **Plan Gratuito**: Suficiente para desarrollo y pruebas

## Modo Demo

Si no hay credenciales configuradas, el sistema funciona en modo demo:
- Los archivos no se suben a IPFS real
- Se generan hashes simulados
- Toda la funcionalidad sigue funcionando
- Ideal para desarrollo y pruebas
