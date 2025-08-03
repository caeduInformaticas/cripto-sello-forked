import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { CheckCircle, Clock, Wallet, FileText, Shield, Copy, Check, Search, RefreshCw, AlertCircle } from 'lucide-react'
import PDFUploader from './PDFUploader'
import pinataService from '../services/pinataService'
import blockchainService from '../utils/blockchain'

const PropertyRegistrationFormSimple = ({ onRegistrationComplete }) => {
  const [formData, setFormData] = useState({
    carnetIdentidad: '',
    description: ''
  })
  
  const [documentInfo, setDocumentInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  
  // Estados para blockchain y flujo
  const [walletAddress, setWalletAddress] = useState('')
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [blockchainLoading, setBlockchainLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [nftTokenId, setNftTokenId] = useState('')
  const [nftState, setNftState] = useState(null)
  const [copied, setCopied] = useState(false)

  // Estados del proceso
  const [processState, setProcessState] = useState({
    walletConnected: false,
    nftCreated: false,
    nftValidated: false
  })

  // Estados para el buscador de propiedades
  const [searchTokenId, setSearchTokenId] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearchSection, setShowSearchSection] = useState(false)
  
  // Estado para mensajes
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('info')

  const showMessage = (text, type = 'info') => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => setMessage(''), 5000)
  }

  // Función para limpiar y ocultar el buscador
  const clearSearchResults = () => {
    setSearchTokenId('')
    setSearchResult(null)
    setShowSearchSection(false)
  }

  const searchProperty = async () => {
    if (!searchTokenId.trim()) {
      showMessage('Por favor ingresa un Token ID', 'error')
      return
    }

    // Verificar que el servicio blockchain puede hacer consultas
    if (!blockchainService.canQuery()) {
      showMessage('Inicializando conexión al contrato...', 'info')
      try {
        const canRetry = await blockchainService.retryReadOnlyInit()
        if (!canRetry) {
          showMessage('No se puede conectar al contrato. Verifica tu conexión a internet.', 'error')
          return
        }
      } catch (error) {
        showMessage('Error conectando al contrato: ' + error.message, 'error')
        return
      }
    }

    try {
      setSearchLoading(true)
      // Enviar el string directamente - validateTokenId() manejará la conversión segura
      const propertyInfo = await blockchainService.getPropertyInfo(searchTokenId.trim())
      setSearchResult({
        tokenId: searchTokenId.trim(),
        ...propertyInfo
      })
      
      // Auto-cargar el NFT si es válido
      if (propertyInfo && propertyInfo.owner !== '0x0000000000000000000000000000000000000000') {
        setNftTokenId(searchTokenId.trim())
        setNftState(propertyInfo.state)
        
        // Actualizar estados del proceso basado en el resultado
        setProcessState(prev => ({
          ...prev,
          walletConnected: isWalletConnected,
          nftCreated: propertyInfo.state >= 0,
          nftValidated: propertyInfo.state >= 1
        }))
        
        // Determinar step actual basado en el estado
        if (!isWalletConnected) {
          setCurrentStep(1)
        } else if (propertyInfo.state === 0) { // IN_NOTARY
          setCurrentStep(3)
        } else if (propertyInfo.state >= 1) { // VALIDATED or higher
          setCurrentStep(4)
        } else {
          setCurrentStep(2)
        }
        
        showMessage(`Propiedad encontrada - Estado: ${blockchainService.getPropertyStateText(propertyInfo.state)}`, 'success')
      } else {
        showMessage('Token ID no encontrado o propiedad no válida', 'error')
      }
    } catch (error) {
      console.error('Error buscando propiedad:', error)
      setSearchResult(null)
      
      // Si es un error de RPC, intentar reconectar automáticamente
      if (error.message.includes('RPC') || error.message.includes('403') || error.message.includes('SERVER_ERROR')) {
        showMessage('Error de RPC detectado. Reintentando con otro proveedor...', 'info')
        try {
          const retrySuccess = await blockchainService.retryReadOnlyInit()
          if (retrySuccess) {
            showMessage('Reconexión exitosa. Intenta buscar de nuevo.', 'success')
          } else {
            showMessage('No se pudo reconectar. Verifica tu conexión o conecta tu wallet.', 'error')
          }
        } catch (retryError) {
          showMessage('Error en reconexión: ' + retryError.message, 'error')
        }
      } else {
        showMessage('Error al buscar la propiedad: ' + error.message, 'error')
      }
    } finally {
      setSearchLoading(false)
    }
  }

  const refreshPropertyState = async () => {
    if (!nftTokenId) {
      showMessage('No hay NFT para actualizar', 'error')
      return
    }
    
    try {
      setSearchLoading(true)
      await checkNFTState()
      showMessage('Estado actualizado correctamente', 'success')
    } catch (error) {
      console.error('Error actualizando estado:', error)
      showMessage('Error al actualizar el estado: ' + error.message, 'error')
    } finally {
      setSearchLoading(false)
    }
  }

  const checkNFTState = useCallback(async () => {
    try {
      const propertyInfo = await blockchainService.getPropertyInfo(parseInt(nftTokenId))
      setNftState(propertyInfo.state)
      
      // Actualizar estados del proceso
      setProcessState(prev => ({
        ...prev,
        nftCreated: propertyInfo.state >= 0, // IN_NOTARY or higher
        nftValidated: propertyInfo.state >= 1  // VALIDATED or higher
      }))

      // Determinar step actual
      if (propertyInfo.state === 0) { // IN_NOTARY
        setCurrentStep(3)
      } else if (propertyInfo.state === 1) { // VALIDATED
        setCurrentStep(4) // Completado
      }
    } catch (error) {
      console.error('Error verificando estado del NFT:', error)
    }
  }, [nftTokenId])

  useEffect(() => {
    // Verificar estado de wallet al cargar y configurar verificación periódica
    const checkInitialWalletState = async () => {
      try {
        const isConnected = await blockchainService.checkWalletConnection()
        if (isConnected) {
          const address = await blockchainService.getConnectedAccount()
          if (address) {
            setWalletAddress(address)
            setIsWalletConnected(true)
            setProcessState(prev => ({ ...prev, walletConnected: true }))
            setCurrentStep(2)
            showMessage(`Wallet reconectada automáticamente: ${address}`, 'success')
          }
        }
      } catch (error) {
        console.warn('Error verificando estado inicial de wallet:', error)
      }
    }

    checkInitialWalletState()

    // Verificar periódicamente el estado de la conexión
    const connectionInterval = setInterval(async () => {
      if (isWalletConnected) {
        const currentAccount = await blockchainService.getConnectedAccount()
        if (!currentAccount) {
          // Conexión perdida
          setWalletAddress('')
          setIsWalletConnected(false)
          setProcessState(prev => ({ ...prev, walletConnected: false }))
          setCurrentStep(1)
          showMessage('Conexión de wallet perdida', 'error')
        }
      }
    }, 5000) // Verificar cada 5 segundos

    return () => clearInterval(connectionInterval)
  }, [isWalletConnected]) // Incluir isWalletConnected en dependencias

  useEffect(() => {
    // Verificar el estado del NFT si tenemos un tokenId
    if (nftTokenId && isWalletConnected) {
      checkNFTState()
    }
  }, [nftTokenId, isWalletConnected, checkNFTState])

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
      setProcessState(prev => ({ ...prev, walletConnected: true }))
      setCurrentStep(2)
      showMessage(`Wallet conectada exitosamente: ${address}`, 'success')
      console.log('Wallet conectada:', address)
    } catch (error) {
      console.error('Error conectando wallet:', error)
      showMessage('Error conectando wallet: ' + error.message, 'error')
    } finally {
      setBlockchainLoading(false)
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      showMessage(`✅ Copiado al portapapeles: ${text.substring(0, 20)}...`, 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copiando al portapapeles:', error)
      showMessage('Error al copiar al portapapeles', 'error')
    }
  }

  const validateNFT = async () => {
    if (!nftTokenId) {
      showMessage('No hay NFT para validar', 'error')
      return
    }

    if (!isWalletConnected) {
      showMessage('Debes conectar tu wallet para validar', 'error')
      return
    }

    try {
      setLoading(true)
      await blockchainService.validateProperty(nftTokenId.trim())
      
      // Actualizar estado inmediatamente
      setNftState(1) // VALIDATED
      setProcessState(prev => ({ ...prev, nftValidated: true }))
      setCurrentStep(4)
      
      // Mostrar mensaje de éxito
      showMessage(`🎉 NFT validado exitosamente! Token ID: ${nftTokenId}`, 'success')
      
      // Limpiar y ocultar el buscador después de validar
      clearSearchResults()
      
      // Verificar estado actualizado desde el contrato
      await checkNFTState()
    } catch (error) {
      console.error('Error validando NFT:', error)
      showMessage('Error validando NFT: ' + error.message, 'error')
    } finally {
      setLoading(false)
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
      showMessage('Por favor completa todos los campos requeridos', 'error')
      return
    }

    // Verificar conexión de wallet si no estamos en modo demo
    if (!pinataService.isDemoMode() && !isWalletConnected) {
      showMessage('Primero debes conectar tu wallet para registrar la propiedad en la blockchain', 'error')
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
          // Usar carnet de identidad como documentId para el contrato
          const documentIdNumber = parseInt(formData.carnetIdentidad.trim())
          const mintResult = await blockchainService.mintProperty(walletAddress, documentIdNumber, metadataResult.url)
          tokenId = mintResult.tokenId
          txHash = mintResult.tx.hash
          
          // Guardar el tokenId para seguimiento
          setNftTokenId(tokenId)
          setNftState(0) // IN_NOTARY
          setProcessState(prev => ({ ...prev, nftCreated: true }))
          setCurrentStep(3)
          
          console.log('NFT minteado exitosamente:', { tokenId, txHash })
          showMessage(`🎉 NFT creado exitosamente! Token ID: ${tokenId}`, 'success')
          
          // Limpiar y ocultar el buscador después de mintear
          clearSearchResults()
        } catch (blockchainError) {
          console.error('Error en blockchain:', blockchainError)
          showMessage('Error al mintear en la blockchain: ' + blockchainError.message, 'error')
          return
        }
      }

      // Preparar datos para el contrato (mint)
      const contractData = {
        // Datos para la función mint del contrato
        tokenURI: metadataResult.url, // URI de IPFS para los metadatos
        carnetIdentidad: formData.carnetIdentidad,
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
        showMessage('✅ Propiedad registrada en modo demo exitosamente', 'success')
      }

      // Limpiar formulario solo en modo demo
      if (pinataService.isDemoMode()) {
        setFormData({ carnetIdentidad: '', description: '' })
        setDocumentInfo(null)
        setErrors({})
      }

    } catch (error) {
      console.error('Error al registrar propiedad:', error)
      showMessage('Error al registrar propiedad: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = () => {
    // Verificar que los campos requeridos tengan contenido
    const hasRequiredFields = formData.carnetIdentidad.trim() && 
                              formData.description.trim() && 
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header del proceso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Registro de Propiedad NFT</CardTitle>
          <CardDescription>
            Sistema profesional de registro de propiedades en blockchain. Sigue estos pasos para crear y validar tu NFT de propiedad.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Indicador de progreso */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {/* Paso 1: Conectar Wallet */}
            <div className="flex flex-col items-center space-y-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                processState.walletConnected ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {processState.walletConnected ? <CheckCircle className="w-6 h-6" /> : <Wallet className="w-6 h-6" />}
              </div>
              <span className={`text-sm font-medium ${processState.walletConnected ? 'text-green-600' : 'text-blue-600'}`}>
                Conectar Wallet
              </span>
            </div>

            <div className={`flex-1 h-1 mx-4 ${processState.walletConnected ? 'bg-green-200' : 'bg-gray-200'}`}></div>

            {/* Paso 2: Crear NFT */}
            <div className="flex flex-col items-center space-y-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                processState.nftCreated ? 'bg-green-100 text-green-600' : 
                processState.walletConnected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {processState.nftCreated ? <CheckCircle className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
              </div>
              <span className={`text-sm font-medium ${
                processState.nftCreated ? 'text-green-600' : 
                processState.walletConnected ? 'text-blue-600' : 'text-gray-400'
              }`}>
                Crear NFT
              </span>
            </div>

            <div className={`flex-1 h-1 mx-4 ${processState.nftCreated ? 'bg-green-200' : 'bg-gray-200'}`}></div>

            {/* Paso 3: Validar NFT */}
            <div className="flex flex-col items-center space-y-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                processState.nftValidated ? 'bg-green-100 text-green-600' : 
                processState.nftCreated ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {processState.nftValidated ? <CheckCircle className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
              </div>
              <span className={`text-sm font-medium ${
                processState.nftValidated ? 'text-green-600' : 
                processState.nftCreated ? 'text-blue-600' : 'text-gray-400'
              }`}>
                Validar NFT
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mensajes del sistema */}
      {message && (
        <Alert className={messageType === 'error' ? 'border-red-200 bg-red-50' : messageType === 'success' ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}>
          {messageType === 'error' ? <AlertCircle className="h-4 w-4" /> : 
           messageType === 'success' ? <CheckCircle className="h-4 w-4" /> : 
           <FileText className="h-4 w-4" />}
          <AlertDescription className={messageType === 'error' ? 'text-red-800' : messageType === 'success' ? 'text-green-800' : 'text-blue-800'}>
            {message}
          </AlertDescription>
        </Alert>
      )}

      {/* Buscador de Propiedades */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-600" />
                Buscar Propiedad Existente
              </CardTitle>
              <CardDescription>
                Busca una propiedad por su Token ID para consultar su estado y continuar el proceso de validación.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSearchSection(!showSearchSection)}
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              {showSearchSection ? 'Ocultar' : 'Mostrar'} Buscador
            </Button>
          </div>
        </CardHeader>
        {showSearchSection && (
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  placeholder="Ingresa el Token ID (ej: 123)"
                  value={searchTokenId}
                  onChange={(e) => setSearchTokenId(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button 
                onClick={searchProperty}
                disabled={searchLoading || !searchTokenId.trim()}
                className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
              >
                {searchLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Buscando...</span>
                  </div>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Buscar
                  </>
                )}
              </Button>
            </div>

            {/* Botón para actualizar estado del NFT actual */}
            {nftTokenId && (
              <div className="flex items-center space-x-2 pt-2 border-t">
                <span className="text-sm text-gray-600">NFT actual: {nftTokenId}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshPropertyState}
                  disabled={searchLoading}
                  className="border-green-300 text-green-600 hover:bg-green-50"
                >
                  {searchLoading ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  <span className="ml-1">Actualizar Estado</span>
                </Button>
              </div>
            )}

            {/* Resultado de la búsqueda */}
            {searchResult && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-blue-800">Propiedad Encontrada</h4>
                  <Badge className={
                    searchResult.state === 0 ? 'bg-yellow-100 text-yellow-800' :
                    searchResult.state === 1 ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {searchResult.state === 0 ? 'EN NOTARÍA' :
                     searchResult.state === 1 ? 'VALIDADO' :
                     searchResult.state === 2 ? 'REGISTRADO' : 'DESCONOCIDO'}
                  </Badge>
                </div>

                {/* Token ID */}
                <div className="space-y-2">
                  <span className="font-medium text-blue-700">Token ID:</span>
                  <div className="flex items-center space-x-2 bg-white border border-blue-200 rounded-md p-3">
                    <p className="text-blue-900 font-mono flex-1 break-all text-sm">{searchResult.tokenId}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(searchResult.tokenId)}
                      className="border-blue-300 text-blue-600 hover:bg-blue-100 flex-shrink-0"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Propietario */}
                <div className="space-y-2">
                  <span className="font-medium text-blue-700">Propietario:</span>
                  <div className="flex items-center space-x-2 bg-white border border-blue-200 rounded-md p-3">
                    <p className="text-blue-900 font-mono flex-1 break-all text-sm">{searchResult.owner}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(searchResult.owner)}
                      className="border-blue-300 text-blue-600 hover:bg-blue-100 flex-shrink-0"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* URI */}
                <div className="space-y-2">
                  <span className="font-medium text-blue-700">URI:</span>
                  <div className="flex items-center space-x-2 bg-white border border-blue-200 rounded-md p-3">
                    <p className="text-blue-900 font-mono flex-1 break-all text-sm">{searchResult.uri || 'N/A'}</p>
                    {searchResult.uri && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(searchResult.uri)}
                        className="border-blue-300 text-blue-600 hover:bg-blue-100 flex-shrink-0"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Estado de conexión al contrato */}
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
              <h5 className="text-xs font-medium text-gray-700 mb-2">Estado de Conexión:</h5>
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${blockchainService.canQuery() ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={blockchainService.canQuery() ? 'text-green-600' : 'text-red-600'}>
                    Consultas: {blockchainService.canQuery() ? 'Activas' : 'Inactivas'}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${blockchainService.canTransact() ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <span className={blockchainService.canTransact() ? 'text-green-600' : 'text-yellow-600'}>
                    Transacciones: {blockchainService.canTransact() ? 'Activas' : 'Wallet requerida'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Paso 1: Conexión de Wallet */}
      {!processState.walletConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-600" />
              Paso 1: Conectar Wallet
            </CardTitle>
            <CardDescription>
              Para comenzar el proceso de registro de propiedad, necesitas conectar tu wallet de MetaMask. 
              Esta será tu identidad digital en la blockchain.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Wallet className="h-4 w-4" />
              <AlertDescription>
                <strong>Importante:</strong> Asegúrate de tener MetaMask instalado y configurado. 
                Tu wallet será utilizada para firmar las transacciones de registro y validación del NFT.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={connectWallet}
              disabled={blockchainLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {blockchainLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Conectando...</span>
                </div>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Conectar MetaMask
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Confirmación de Wallet Conectada */}
      {processState.walletConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Wallet Conectada Exitosamente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">Conectado</span>
              </div>
              <p className="text-xs text-green-600 mt-1 font-mono">
                {walletAddress}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paso 2: Formulario de Registro */}
      {processState.walletConnected && !processState.nftCreated && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Paso 2: Crear NFT de Propiedad
            </CardTitle>
            <CardDescription>
              Completa la información de la propiedad y sube los documentos necesarios. 
              Al finalizar se creará un NFT único que representa tu propiedad en la blockchain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Carnet de Identidad */}
              <div className="space-y-2">
                <Label htmlFor="carnetIdentidad">
                  Carnet de Identidad del Propietario *
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
                  Este número será utilizado como identificador único del documento en la blockchain
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
                  placeholder="Ej: Casa unifamiliar de 150m², ubicada en av. Roca y Coronado, Santa Cruz. Cuenta con 3 dormitorios, 2 baños, sala, comedor y garaje."
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
                  Proporciona una descripción detallada y precisa de la propiedad (mínimo 10 caracteres)
                </p>
              </div>

              {/* Subida de Documento */}
              <div className="space-y-2">
                <Label>
                  Documento de Propiedad (PDF) *
                </Label>
                <PDFUploader onPDFUploaded={handlePDFUploaded} />
                {errors.document && (
                  <p className="text-sm text-red-600">{errors.document}</p>
                )}
                <p className="text-xs text-gray-500">
                  Sube el documento oficial de la propiedad en formato PDF. Este será almacenado de forma segura en IPFS.
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

              {/* Botón de envío */}
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                disabled={loading || !isFormValid()}
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creando NFT...</span>
                  </div>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Crear NFT de Propiedad
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Paso 3: NFT Creado - Mostrar Token ID */}
      {processState.nftCreated && !processState.nftValidated && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              NFT Creado Exitosamente
            </CardTitle>
            <CardDescription>
              Tu NFT de propiedad ha sido creado y registrado en la blockchain con estado "EN NOTARÍA". 
              Ahora puedes proceder a validarlo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Token ID del NFT:</p>
                  <p className="text-lg font-mono text-blue-900">{nftTokenId}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(nftTokenId)}
                  className="border-blue-300 text-blue-600 hover:bg-blue-100"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <Badge className="mt-2 bg-yellow-100 text-yellow-800">
                <Clock className="w-3 h-3 mr-1" />
                Estado: EN NOTARÍA
              </Badge>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Siguiente paso:</strong> El NFT está registrado y esperando validación. 
                Como notario, puedes proceder a validar la autenticidad de los documentos.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={validateNFT}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Validando...</span>
                </div>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Validar NFT de Propiedad
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Paso 4: NFT Validado */}
      {processState.nftValidated && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              NFT Validado Completamente
            </CardTitle>
            <CardDescription>
              ¡Excelente! Tu NFT de propiedad ha sido validado exitosamente por la notaría. 
              El proceso de registro está completo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Token ID del NFT:</p>
                  <p className="text-lg font-mono text-green-900">{nftTokenId}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(nftTokenId)}
                  className="border-green-300 text-green-600 hover:bg-green-100"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <Badge className="mt-2 bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Estado: VALIDADO
              </Badge>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Proceso completado:</strong> Tu propiedad está oficialmente registrada como NFT 
                y ha sido validada por la notaría. Puedes usar este Token ID para futuras consultas.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Información sobre el proceso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">¿Cómo funciona el registro NFT?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-blue-800">1. Conexión Segura</h3>
              <p className="text-sm text-gray-600 mt-2">
                Conecta tu wallet para establecer tu identidad digital en la blockchain
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-blue-800">2. Registro NFT</h3>
              <p className="text-sm text-gray-600 mt-2">
                Crea un NFT único que representa tu propiedad con estado "EN NOTARÍA"
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-green-800">3. Validación Oficial</h3>
              <p className="text-sm text-gray-600 mt-2">
                La notaría valida la autenticidad y cambia el estado a "VALIDADO"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PropertyRegistrationFormSimple
