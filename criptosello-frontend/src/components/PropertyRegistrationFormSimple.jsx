import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Alert, AlertDescription } from './ui/alert'
import PDFUploader from './PDFUploader'
import pinataService from '../services/pinataService'
import blockchainService from '../utils/blockchain'

const PropertyRegistrationFormSimple = ({ onRegistrationComplete }) => {
  const [formData, setFormData] = useState({
    carnetIdentidad: '',
    description: '',
    documentId: ''
  })
  
  const [documentInfo, setDocumentInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  
  // Estados para blockchain
  const [walletAddress, setWalletAddress] = useState('')
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [blockchainLoading, setBlockchainLoading] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Limpiar error específico cuando se cumple el requisito mínimo
    if (errors[name]) {
      let shouldClearError = false
      
      if (name === 'carnetIdentidad') {
        // Limpiar error cuando tiene al menos 7 dígitos y son solo números
        shouldClearError = value.trim().length >= 7 && /^[0-9]+$/.test(value.trim())
      } else if (name === 'documentId') {
        // Limpiar error cuando son solo números
        shouldClearError = value.trim().length > 0 && /^[0-9]+$/.test(value.trim())
      } else if (name === 'description') {
        // Limpiar error cuando tiene al menos 10 caracteres
        shouldClearError = value.trim().length >= 10
      }
      
      if (shouldClearError) {
        setErrors(prev => ({
          ...prev,
          [name]: null
        }))
      }
    }
  }

  const handlePDFUploaded = (result) => {
    setDocumentInfo(result)
  }

  const connectWallet = async () => {
    try {
      setBlockchainLoading(true)
      const address = await blockchainService.connectWallet()
      setWalletAddress(address)
      setIsWalletConnected(true)
      console.log('Wallet conectada:', address)
    } catch (error) {
      console.error('Error conectando wallet:', error)
      alert(`Error conectando wallet: ${error.message}`)
    } finally {
      setBlockchainLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Validar carnet de identidad
    if (!formData.carnetIdentidad.trim()) {
      newErrors.carnetIdentidad = 'Carnet de identidad es requerido'
    } else if (!/^[0-9]+$/.test(formData.carnetIdentidad.trim())) {
      newErrors.carnetIdentidad = 'Carnet de identidad debe contener solo números'
    } else if (formData.carnetIdentidad.trim().length < 7) {
      newErrors.carnetIdentidad = 'Carnet de identidad debe tener al menos 7 dígitos'
    }

    // Validar documentId
    if (!formData.documentId.trim()) {
      newErrors.documentId = 'ID del documento es requerido'
    } else if (!/^[0-9]+$/.test(formData.documentId.trim())) {
      newErrors.documentId = 'ID del documento debe contener solo números'
    }

    // Validar descripción
    if (!formData.description.trim()) {
      newErrors.description = 'Descripción es requerida'
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'La descripción debe tener al menos 10 caracteres'
    }

    // Validar documento
    if (!documentInfo) {
      newErrors.document = 'Documento PDF es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // Verificar conexión de wallet si no estamos en modo demo
    if (!pinataService.isDemoMode() && !isWalletConnected) {
      alert('Primero debes conectar tu wallet para registrar la propiedad en la blockchain')
      return
    }

    setLoading(true)

    try {
      console.log('Registrando propiedad...', formData, documentInfo)

      // Validar datos en el servicio
      pinataService.validatePropertyData(formData)

      // Crear metadatos de la propiedad con el documento
      const metadataResult = await pinataService.createPropertyMetadata(formData, documentInfo)

      console.log('Metadatos creados:', metadataResult)

      let tokenId = null
      let txHash = null

      // Si no estamos en modo demo, hacer mint en el contrato
      if (!pinataService.isDemoMode()) {
        try {
          console.log('Minteando NFT en la blockchain...')
          // Convertir documentId a número para el contrato
          const documentIdNumber = parseInt(formData.documentId.trim())
          const mintResult = await blockchainService.mintProperty(walletAddress, documentIdNumber, metadataResult.url)
          tokenId = mintResult.tokenId
          txHash = mintResult.tx.hash
          console.log('NFT minteado exitosamente:', { tokenId, txHash })
        } catch (blockchainError) {
          console.error('Error en blockchain:', blockchainError)
          alert(`Error al mintear en la blockchain: ${blockchainError.message}`)
          return
        }
      }

      // Preparar datos para el contrato (mint)
      const contractData = {
        // Datos para la función mint del contrato
        tokenURI: metadataResult.url, // URI de IPFS para los metadatos
        carnetIdentidad: formData.carnetIdentidad,
        documentId: formData.documentId,
        description: formData.description,
        
        // Información adicional
        metadataHash: metadataResult.ipfsHash,
        documentHash: documentInfo.ipfsHash,
        documentUrl: documentInfo.url,
        
        // Información de blockchain
        tokenId: tokenId,
        transactionHash: txHash,
        ownerAddress: walletAddress,
        
        // Metadatos completos
        metadata: metadataResult.metadata,
        
        // Indicadores
        isDemoMode: pinataService.isDemoMode()
      }

      console.log('Datos preparados para el contrato:', contractData)

      // Notificar al componente padre
      if (onRegistrationComplete) {
        onRegistrationComplete(contractData)
      }

      // Mostrar éxito
      if (pinataService.isDemoMode()) {
        alert('✅ Propiedad registrada en modo demo exitosamente')
      } else {
        alert(`✅ Propiedad registrada exitosamente en la blockchain!\n\nToken ID: ${tokenId}\nTransacción: ${txHash}\nURI de metadatos: ${metadataResult.url}`)
      }

      // Limpiar formulario
      setFormData({ carnetIdentidad: '', description: '', documentId: '' })
      setDocumentInfo(null)
      setErrors({})

    } catch (error) {
      console.error('Error al registrar propiedad:', error)
      alert(`Error al registrar propiedad: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = () => {
    // Verificar que los campos requeridos tengan contenido
    const hasRequiredFields = formData.carnetIdentidad.trim() && 
                              formData.description.trim() && 
                              formData.documentId.trim() &&
                              documentInfo

    // Solo considerar errores críticos que impiden el envío
    const hasCriticalErrors = Object.keys(errors).some(key => {
      const error = errors[key]
      return error && (
        // Errores de formato que impiden el envío
        error.includes('contener solo números') ||
        error.includes('al menos 7 dígitos') ||
        error.includes('al menos 10 caracteres') ||
        error.includes('requerido')
      )
    })

    // Verificar conexión de wallet si no estamos en modo demo
    const walletRequirement = pinataService.isDemoMode() || isWalletConnected

    return hasRequiredFields && !hasCriticalErrors && walletRequirement
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Registro de Propiedad</CardTitle>
          <CardDescription>
            Completa los datos para registrar una nueva propiedad en CriptoSello
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Carnet de Identidad */}
            <div className="space-y-2">
              <Label htmlFor="carnetIdentidad">
                Carnet de Identidad *
              </Label>
              <Input
                id="carnetIdentidad"
                name="carnetIdentidad"
                type="text"
                placeholder="Ej: 12345678"
                value={formData.carnetIdentidad}
                onChange={handleInputChange}
                className={errors.carnetIdentidad ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.carnetIdentidad && (
                <p className="text-sm text-red-600">{errors.carnetIdentidad}</p>
              )}
              <p className="text-xs text-gray-500">
                Ingresa el número de carnet de identidad del propietario
              </p>
            </div>

            {/* ID del Documento */}
            <div className="space-y-2">
              <Label htmlFor="documentId">
                ID del Documento *
              </Label>
              <Input
                id="documentId"
                name="documentId"
                type="text"
                placeholder="Ej: 123456"
                value={formData.documentId}
                onChange={handleInputChange}
                className={errors.documentId ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.documentId && (
                <p className="text-sm text-red-600">{errors.documentId}</p>
              )}
              <p className="text-xs text-gray-500">
                Ingresa el ID único del documento (número catastral, registro, etc.)
              </p>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Descripción de la Propiedad *
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe la propiedad: ubicación, características, etc."
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className={errors.description ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description}</p>
              )}
              <p className="text-xs text-gray-500">
                Proporciona una descripción detallada de la propiedad (mínimo 10 caracteres)
              </p>
            </div>

            {/* Subida de Documento */}
            <div className="space-y-2">
              <Label>
                Documento de Propiedad *
              </Label>
              <PDFUploader onPDFUploaded={handlePDFUploaded} />
              {errors.document && (
                <p className="text-sm text-red-600">{errors.document}</p>
              )}
              <p className="text-xs text-gray-500">
                Sube el documento oficial de la propiedad en formato PDF
              </p>
            </div>

            {/* Información del estado */}
            {pinataService.isDemoMode() && (
              <Alert>
                <AlertDescription>
                  <strong>Modo Demo:</strong> Los datos se procesarán localmente. 
                  Para usar IPFS real, configura tus credenciales de Pinata.
                </AlertDescription>
              </Alert>
            )}

            {/* Conexión de Wallet */}
            {!pinataService.isDemoMode() && (
              <div className="space-y-3">
                <Label>Conexión de Wallet</Label>
                {!isWalletConnected ? (
                  <div className="space-y-2">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={connectWallet}
                      disabled={blockchainLoading}
                      className="w-full"
                    >
                      {blockchainLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          <span>Conectando...</span>
                        </div>
                      ) : (
                        '🦊 Conectar MetaMask'
                      )}
                    </Button>
                    <p className="text-xs text-gray-500">
                      Conecta tu wallet para registrar la propiedad en la blockchain
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-800">Wallet Conectada</span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Botón de envío */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !isFormValid()}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Registrando...</span>
                </div>
              ) : (
                'Registrar Propiedad'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Información sobre el proceso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Proceso de Registro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold">1</span>
            </div>
            <div>
              <p className="font-medium">Mint del Token</p>
              <p className="text-sm text-gray-600">Se crea el NFT con estado "EN_NOTARY"</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold">2</span>
            </div>
            <div>
              <p className="font-medium text-gray-600">Validación de Notaría</p>
              <p className="text-sm text-gray-500">La notaría valida los documentos</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold">3</span>
            </div>
            <div>
              <p className="font-medium text-gray-600">Registro Oficial</p>
              <p className="text-sm text-gray-500">DDRR registra oficialmente la propiedad</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PropertyRegistrationFormSimple
