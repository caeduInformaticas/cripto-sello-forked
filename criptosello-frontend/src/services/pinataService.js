class PinataService {
  constructor() {
    // Credenciales de Pinata Cloud
    this.apiKey = import.meta.env.VITE_PINATA_API_KEY
    this.secretApiKey = import.meta.env.VITE_PINATA_SECRET_API_KEY
    this.jwt = import.meta.env.VITE_PINATA_JWT
    
    // URL base de la API de Pinata
    this.apiUrl = 'https://api.pinata.cloud'
    this.gatewayUrl = 'https://gateway.pinata.cloud/ipfs'
    
    // Validar credenciales
    this.isConfigured = this.jwt || (this.apiKey && this.secretApiKey)
    
    if (!this.isConfigured) {
      console.warn('Pinata no está configurado. Funcionando en modo demo.')
    } else {
      console.log('Pinata configurado correctamente')
    }
    
    // Estados del contrato CriptoSello
    this.TOKEN_STATES = {
      IN_NOTARY: 0,
      VALIDATED: 1,
      REGISTERED: 2
    }
    
    // Mapeo de estados para mostrar
    this.STATE_LABELS = {
      0: 'En Notaría',
      1: 'Validado',
      2: 'Registrado'
    }
  }

  /**
   * Verifica si Pinata está configurado correctamente
   * @returns {boolean}
   */
  isConfiguredCorrectly() {
    return this.isConfigured
  }

  /**
   * Verifica si está en modo demo
   * @returns {boolean}
   */
  isDemoMode() {
    return !this.isConfigured
  }

  /**
   * Obtiene los headers para las peticiones a Pinata
   * @returns {Object}
   */
  getHeaders() {
    if (this.jwt) {
      return {
        'Authorization': `Bearer ${this.jwt}`
      }
    } else if (this.apiKey && this.secretApiKey) {
      return {
        'pinata_api_key': this.apiKey,
        'pinata_secret_api_key': this.secretApiKey
      }
    }
    return {}
  }

  /**
   * Sube un archivo PDF a Pinata
   * @param {File} file - Archivo PDF a subir
   * @param {string} name - Nombre del archivo (opcional)
   * @returns {Promise<{ipfsHash: string, pinSize: number, timestamp: string, url: string}>}
   */
  async uploadPDF(file, name = null) {
    try {
      // Validar que sea un PDF
      if (file.type !== 'application/pdf') {
        throw new Error('Solo se permiten archivos PDF')
      }

      // Validar tamaño (máximo 100MB)
      const maxSize = 100 * 1024 * 1024 // 100MB
      if (file.size > maxSize) {
        throw new Error('El archivo es demasiado grande. Máximo 100MB.')
      }

      console.log('Subiendo PDF a Pinata...', {
        name: file.name,
        size: file.size,
        type: file.type,
        configured: this.isConfigured
      })

      // Si no está configurado, usar modo demo
      if (!this.isConfigured) {
        console.warn('Funcionando en modo demo - archivo no se subirá a IPFS real')
        const demoHash = 'QmDemo' + Math.random().toString(36).substr(2, 9)
        
        return {
          ipfsHash: demoHash,
          pinSize: file.size,
          timestamp: new Date().toISOString(),
          url: `${this.gatewayUrl}/${demoHash}`,
          demo: true,
          name: name || file.name
        }
      }

      // Crear FormData para la subida
      const formData = new FormData()
      formData.append('file', file)
      
      // Metadata para Pinata
      const metadata = {
        name: name || file.name,
        keyvalues: {
          type: 'property-document',
          originalName: file.name,
          uploadedAt: new Date().toISOString()
        }
      }
      formData.append('pinataMetadata', JSON.stringify(metadata))

      // Opciones de pin
      const options = {
        cidVersion: 1
      }
      formData.append('pinataOptions', JSON.stringify(options))

      // Realizar la petición
      const response = await fetch(`${this.apiUrl}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Error de Pinata: ${errorData.error || response.statusText}`)
      }

      const result = await response.json()
      
      const uploadResult = {
        ipfsHash: result.IpfsHash,
        pinSize: result.PinSize,
        timestamp: result.Timestamp,
        url: `${this.gatewayUrl}/${result.IpfsHash}`,
        name: name || file.name
      }

      console.log('PDF subido exitosamente a Pinata:', uploadResult)
      return uploadResult

    } catch (error) {
      console.error('Error al subir PDF a Pinata:', error)
      
      // Si hay error, usar modo demo como fallback
      if (error.message.includes('API') || error.message.includes('fetch')) {
        console.warn('Error de API, usando modo demo como fallback')
        const demoHash = 'QmDemo' + Math.random().toString(36).substr(2, 9)
        
        return {
          ipfsHash: demoHash,
          pinSize: file.size,
          timestamp: new Date().toISOString(),
          url: `${this.gatewayUrl}/${demoHash}`,
          demo: true,
          error: error.message,
          name: name || file.name
        }
      }
      
      throw error
    }
  }

  /**
   * Crea metadatos de propiedad y los sube a Pinata
   * @param {Object} propertyData - Datos de la propiedad
   * @param {Object} documentInfo - Información del documento subido
   * @returns {Promise<{ipfsHash: string, url: string, metadata: Object}>}
   */
  async createPropertyMetadata(propertyData, documentInfo = null) {
    try {
      console.log('Creando metadatos de propiedad...', propertyData)

      // Validar datos requeridos
      if (!propertyData.carnetIdentidad) {
        throw new Error('Carnet de identidad es requerido')
      }
      if (!propertyData.description) {
        throw new Error('Descripción es requerida')
      }

      // Crear metadatos NFT estándar
      const metadata = {
        name: `Propiedad - CI: ${propertyData.carnetIdentidad}`,
        description: propertyData.description,
        image: '', // No usamos imagen principal
        
        // Atributos NFT estándar
        attributes: [
          {
            trait_type: 'Carnet de Identidad',
            value: propertyData.carnetIdentidad
          },
          {
            trait_type: 'Registration Date',
            value: new Date().toISOString(),
            display_type: 'date'
          },
          {
            trait_type: 'Status',
            value: 'IN_NOTARY'
          }
        ],

        // Datos específicos para CriptoSello
        criptosello: {
          carnetIdentidad: propertyData.carnetIdentidad,
          description: propertyData.description,
          document: documentInfo,
          createdAt: new Date().toISOString(),
          status: 'IN_NOTARY',
          version: '1.0'
        }
      }

      // Si no está configurado, usar modo demo
      if (!this.isConfigured) {
        console.warn('Creando metadatos en modo demo')
        const demoHash = 'QmMetadata' + Math.random().toString(36).substr(2, 9)
        
        return {
          ipfsHash: demoHash,
          url: `${this.gatewayUrl}/${demoHash}`,
          metadata: metadata,
          demo: true
        }
      }

      // Subir metadatos a Pinata
      const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
        type: 'application/json'
      })

      const formData = new FormData()
      formData.append('file', metadataBlob, 'metadata.json')
      
      // Metadata para Pinata
      const pinataMetadata = {
        name: `metadata-${propertyData.carnetIdentidad}.json`,
        keyvalues: {
          type: 'property-metadata',
          carnetIdentidad: propertyData.carnetIdentidad,
          status: 'IN_NOTARY',
          createdAt: new Date().toISOString()
        }
      }
      formData.append('pinataMetadata', JSON.stringify(pinataMetadata))

      // Opciones de pin
      const options = {
        cidVersion: 1
      }
      formData.append('pinataOptions', JSON.stringify(options))

      // Realizar la petición
      const response = await fetch(`${this.apiUrl}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Error de Pinata: ${errorData.error || response.statusText}`)
      }

      const result = await response.json()
      
      const uploadResult = {
        ipfsHash: result.IpfsHash,
        url: `${this.gatewayUrl}/${result.IpfsHash}`,
        metadata: metadata
      }

      console.log('Metadatos subidos exitosamente a Pinata:', uploadResult)
      return uploadResult

    } catch (error) {
      console.error('Error al crear metadatos:', error)
      
      // Si hay error, usar modo demo como fallback
      if (error.message.includes('API') || error.message.includes('fetch')) {
        console.warn('Error de API, usando modo demo')
        const demoHash = 'QmMetadata' + Math.random().toString(36).substr(2, 9)
        
        const demoMetadata = {
          name: `Propiedad - CI: ${propertyData.carnetIdentidad}`,
          description: propertyData.description,
          image: '',
          attributes: [
            { trait_type: 'Carnet de Identidad', value: propertyData.carnetIdentidad },
            { trait_type: 'Registration Date', value: new Date().toISOString(), display_type: 'date' },
            { trait_type: 'Status', value: 'IN_NOTARY' }
          ],
          criptosello: {
            carnetIdentidad: propertyData.carnetIdentidad,
            description: propertyData.description,
            document: documentInfo,
            createdAt: new Date().toISOString(),
            status: 'IN_NOTARY',
            version: '1.0'
          }
        }
        
        return {
          ipfsHash: demoHash,
          url: `${this.gatewayUrl}/${demoHash}`,
          metadata: demoMetadata,
          demo: true,
          error: error.message
        }
      }
      
      throw error
    }
  }

  /**
   * Actualiza metadatos para el proceso de validación
   * @param {string} originalHash - Hash IPFS de los metadatos originales
   * @param {Object} validationData - Datos de validación
   * @returns {Promise<{ipfsHash: string, url: string}>}
   */
  async updatePropertyForValidation(originalHash, validationData) {
    try {
      // Si no está configurado, usar modo demo
      if (!this.isConfigured) {
        console.warn('Actualizando para validación en modo demo')
        const demoHash = 'QmValidated' + Math.random().toString(36).substr(2, 9)
        return {
          ipfsHash: demoHash,
          url: `${this.gatewayUrl}/${demoHash}`,
          demo: true
        }
      }

      // Obtener metadatos originales
      const originalMetadata = await this.getMetadataFromHash(originalHash)
      
      // Actualizar metadatos con información de validación
      const updatedMetadata = {
        ...originalMetadata,
        attributes: originalMetadata.attributes.map(attr => 
          attr.trait_type === 'Status' 
            ? { ...attr, value: 'VALIDATED' }
            : attr
        ),
        criptosello: {
          ...originalMetadata.criptosello,
          validationInfo: {
            validatedBy: validationData.notaryAddress,
            validatedAt: new Date().toISOString(),
            validationNotes: validationData.notes || '',
            notarySignature: validationData.signature || ''
          },
          status: 'VALIDATED',
          updatedAt: new Date().toISOString()
        }
      }

      // Subir metadatos actualizados
      const metadataBlob = new Blob([JSON.stringify(updatedMetadata, null, 2)], {
        type: 'application/json'
      })

      const formData = new FormData()
      formData.append('file', metadataBlob, 'metadata-validated.json')
      
      const pinataMetadata = {
        name: `metadata-validated-${updatedMetadata.criptosello.carnetIdentidad}.json`,
        keyvalues: {
          type: 'property-metadata',
          carnetIdentidad: updatedMetadata.criptosello.carnetIdentidad,
          status: 'VALIDATED',
          validatedAt: new Date().toISOString()
        }
      }
      formData.append('pinataMetadata', JSON.stringify(pinataMetadata))

      const response = await fetch(`${this.apiUrl}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Error de Pinata: ${response.statusText}`)
      }

      const result = await response.json()
      
      return {
        ipfsHash: result.IpfsHash,
        url: `${this.gatewayUrl}/${result.IpfsHash}`
      }

    } catch (error) {
      console.error('Error al actualizar metadatos para validación:', error)
      
      // Fallback en modo demo si hay error
      if (error.message.includes('API') || error.message.includes('fetch')) {
        console.warn('Error de API, usando modo demo')
        const demoHash = 'QmValidated' + Math.random().toString(36).substr(2, 9)
        return {
          ipfsHash: demoHash,
          url: `${this.gatewayUrl}/${demoHash}`,
          demo: true,
          error: error.message
        }
      }
      
      throw error
    }
  }

  /**
   * Actualiza metadatos para el registro final
   * @param {string} originalHash - Hash IPFS de los metadatos validados
   * @param {Object} registrationData - Datos de registro
   * @returns {Promise<{ipfsHash: string, url: string}>}
   */
  async updatePropertyForRegistration(originalHash, registrationData) {
    try {
      // Si no está configurado, usar modo demo
      if (!this.isConfigured) {
        console.warn('Actualizando para registro en modo demo')
        const demoHash = 'QmRegistered' + Math.random().toString(36).substr(2, 9)
        return {
          ipfsHash: demoHash,
          url: `${this.gatewayUrl}/${demoHash}`,
          demo: true
        }
      }

      // Obtener metadatos validados
      const validatedMetadata = await this.getMetadataFromHash(originalHash)
      
      // Actualizar metadatos con información de registro
      const updatedMetadata = {
        ...validatedMetadata,
        attributes: validatedMetadata.attributes.map(attr => 
          attr.trait_type === 'Status' 
            ? { ...attr, value: 'REGISTERED' }
            : attr
        ),
        criptosello: {
          ...validatedMetadata.criptosello,
          registrationInfo: {
            registeredBy: registrationData.ddrAddress,
            registeredAt: new Date().toISOString(),
            registrationNotes: registrationData.notes || '',
            officialSignature: registrationData.signature || ''
          },
          status: 'REGISTERED',
          updatedAt: new Date().toISOString()
        }
      }

      // Subir metadatos actualizados
      const metadataBlob = new Blob([JSON.stringify(updatedMetadata, null, 2)], {
        type: 'application/json'
      })

      const formData = new FormData()
      formData.append('file', metadataBlob, 'metadata-registered.json')
      
      const pinataMetadata = {
        name: `metadata-registered-${updatedMetadata.criptosello.carnetIdentidad}.json`,
        keyvalues: {
          type: 'property-metadata',
          carnetIdentidad: updatedMetadata.criptosello.carnetIdentidad,
          status: 'REGISTERED',
          registeredAt: new Date().toISOString()
        }
      }
      formData.append('pinataMetadata', JSON.stringify(pinataMetadata))

      const response = await fetch(`${this.apiUrl}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Error de Pinata: ${response.statusText}`)
      }

      const result = await response.json()
      
      return {
        ipfsHash: result.IpfsHash,
        url: `${this.gatewayUrl}/${result.IpfsHash}`
      }

    } catch (error) {
      console.error('Error al actualizar metadatos para registro:', error)
      
      // Fallback en modo demo si hay error
      if (error.message.includes('API') || error.message.includes('fetch')) {
        console.warn('Error de API, usando modo demo')
        const demoHash = 'QmRegistered' + Math.random().toString(36).substr(2, 9)
        return {
          ipfsHash: demoHash,
          url: `${this.gatewayUrl}/${demoHash}`,
          demo: true,
          error: error.message
        }
      }
      
      throw error
    }
  }

  /**
   * Obtiene metadatos desde un hash IPFS
   * @param {string} hash - Hash IPFS
   * @returns {Promise<Object>}
   */
  async getMetadataFromHash(hash) {
    try {
      const response = await fetch(`${this.gatewayUrl}/${hash}`)
      
      if (!response.ok) {
        throw new Error(`Error al obtener metadatos: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error al obtener metadatos:', error)
      throw error
    }
  }

  /**
   * Valida los datos de propiedad
   * @param {Object} propertyData - Datos a validar
   * @throws {Error} Si los datos no son válidos
   */
  validatePropertyData(propertyData) {
    if (!propertyData) {
      throw new Error('Datos de propiedad son requeridos')
    }

    if (!propertyData.carnetIdentidad || propertyData.carnetIdentidad.trim().length === 0) {
      throw new Error('Carnet de identidad es requerido')
    }

    if (!propertyData.description || propertyData.description.trim().length === 0) {
      throw new Error('Descripción es requerida')
    }

    // Validación básica del formato de carnet (puedes ajustar según el país)
    const carnetRegex = /^[0-9]+$/
    if (!carnetRegex.test(propertyData.carnetIdentidad.trim())) {
      throw new Error('Carnet de identidad debe contener solo números')
    }

    if (propertyData.description.trim().length < 10) {
      throw new Error('La descripción debe tener al menos 10 caracteres')
    }
  }

  /**
   * Obtiene información de un pin desde Pinata
   * @param {string} hash - Hash IPFS del pin
   * @returns {Promise<Object>}
   */
  async getPinInfo(hash) {
    try {
      if (!this.isConfigured) {
        return { demo: true, hash }
      }

      const response = await fetch(`${this.apiUrl}/data/pinList?hashContains=${hash}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error(`Error al obtener información del pin: ${response.statusText}`)
      }

      const data = await response.json()
      return data.rows[0] || null

    } catch (error) {
      console.error('Error al obtener información del pin:', error)
      throw error
    }
  }
}

// Crear instancia singleton
const pinataService = new PinataService()

export default pinataService
