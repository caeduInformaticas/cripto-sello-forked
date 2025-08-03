import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { 
  Building2, 
  Wallet, 
  Search, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Copy, 
  Check,
  Shield
} from 'lucide-react'
import blockchainService from '../utils/blockchain'

const DDRRPanel = () => {
  // Estados para wallet y conexión
  const [walletAddress, setWalletAddress] = useState('')
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [blockchainLoading, setBlockchainLoading] = useState(false)
  
  // Estados para el buscador de propiedades
  const [searchTokenId, setSearchTokenId] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearchSection, setShowSearchSection] = useState(false)
  
  // Estados para registro
  const [registerLoading, setRegisterLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  
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
          showMessage('Conexión de wallet perdida', 'error')
        }
      }
    }, 5000) // Verificar cada 5 segundos

    return () => clearInterval(connectionInterval)
  }, [isWalletConnected])

  const connectWallet = async () => {
    try {
      setBlockchainLoading(true)
      const address = await blockchainService.connectWallet()
      setWalletAddress(address)
      setIsWalletConnected(true)
      showMessage(`Wallet conectada exitosamente: ${address}`, 'success')
      console.log('Wallet conectada:', address)
    } catch (error) {
      console.error('Error conectando wallet:', error)
      showMessage('Error conectando wallet: ' + error.message, 'error')
    } finally {
      setBlockchainLoading(false)
    }
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
      const propertyInfo = await blockchainService.getPropertyInfo(searchTokenId.trim())
      setSearchResult({
        tokenId: searchTokenId.trim(),
        ...propertyInfo
      })
      
      if (propertyInfo && propertyInfo.owner !== '0x0000000000000000000000000000000000000000') {
        const stateText = blockchainService.getPropertyStateText(propertyInfo.state)
        showMessage(`Propiedad encontrada - Estado: ${stateText}`, 'success')
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
    if (!searchResult?.tokenId) {
      showMessage('No hay propiedad para actualizar', 'error')
      return
    }
    
    try {
      setSearchLoading(true)
      const propertyInfo = await blockchainService.getPropertyInfo(searchResult.tokenId)
      setSearchResult({
        ...searchResult,
        ...propertyInfo
      })
      showMessage('Estado actualizado correctamente', 'success')
    } catch (error) {
      console.error('Error actualizando estado:', error)
      showMessage('Error al actualizar el estado: ' + error.message, 'error')
    } finally {
      setSearchLoading(false)
    }
  }

  const registerProperty = async () => {
    if (!searchResult) {
      showMessage('No hay propiedad para registrar', 'error')
      return
    }

    if (!isWalletConnected) {
      showMessage('Debes conectar tu wallet para registrar', 'error')
      return
    }

    if (searchResult.state !== 1) { // VALIDATED
      showMessage('Solo se pueden registrar propiedades con estado VALIDADO', 'error')
      return
    }

    try {
      setRegisterLoading(true)
      await blockchainService.registerProperty(searchResult.tokenId.toString(), searchResult.uri.toString())

      // Actualizar estado inmediatamente
      setSearchResult(prev => ({
        ...prev,
        state: 2 // REGISTERED
      }))
      
      // Mostrar mensaje de éxito
      showMessage(`🎉 Propiedad registrada exitosamente! Token ID: ${searchResult.tokenId}`, 'success')
      
      // Limpiar y ocultar el buscador después de registrar
      setTimeout(() => {
        clearSearchResults()
      }, 3000)
    } catch (error) {
      console.error('Error registrando propiedad:', error)
      showMessage('Error registrando propiedad: ' + error.message, 'error')
    } finally {
      setRegisterLoading(false)
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header del panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Building2 className="w-6 h-6 text-purple-600" />
            Panel DDRR - Registro Oficial de Propiedades
          </CardTitle>
          <CardDescription>
            Como funcionario de Derechos Reales, puedes registrar oficialmente las propiedades 
            que han sido validadas por notarías, estableciendo el registro definitivo en la blockchain.
          </CardDescription>
        </CardHeader>
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

      {/* Paso 1: Conexión de Wallet */}
      {!isWalletConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-purple-600" />
              Paso 1: Conectar Wallet DDRR
            </CardTitle>
            <CardDescription>
              Para acceder a las funciones de registro oficial, necesitas conectar tu wallet autorizada. 
              Esta será tu identidad digital como funcionario de Derechos Reales.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Wallet className="h-4 w-4" />
              <AlertDescription>
                <strong>Importante:</strong> Solo las wallets autorizadas por DDRR pueden registrar propiedades oficialmente. 
                Asegúrate de usar la wallet institucional proporcionada.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={connectWallet}
              disabled={blockchainLoading}
              className="w-full bg-purple-600 hover:bg-purple-700"
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
                  Conectar Wallet DDRR
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Confirmación de Wallet Conectada */}
      {isWalletConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-600">
              <CheckCircle className="w-5 h-5" />
              Wallet DDRR Conectada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-purple-800">Funcionario DDRR Conectado</span>
              </div>
              <p className="text-xs text-purple-600 mt-1 font-mono">
                {walletAddress}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Buscador de Propiedades */}
      {isWalletConnected && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-purple-600" />
                  Buscar Propiedad para Registro
                </CardTitle>
                <CardDescription>
                  Busca propiedades validadas por notarías que estén listas para el registro oficial en DDRR.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSearchSection(!showSearchSection)}
                className="border-purple-300 text-purple-600 hover:bg-purple-50"
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
                  className="bg-purple-600 hover:bg-purple-700 min-w-[120px]"
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

              {/* Botón para actualizar estado de la propiedad actual */}
              {searchResult && (
                <div className="flex items-center space-x-2 pt-2 border-t">
                  <span className="text-sm text-gray-600">Propiedad actual: {searchResult.tokenId}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshPropertyState}
                    disabled={searchLoading}
                    className="border-purple-300 text-purple-600 hover:bg-purple-50"
                  >
                    {searchLoading ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    <span className="ml-1">Actualizar Estado</span>
                  </Button>
                </div>
              )}

              {/* Resultado de la búsqueda */}
              {searchResult && (
                <div className="bg-purple-50 border border-purple-200 rounded-md p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-purple-800">Propiedad Encontrada</h4>
                    <Badge className={
                      searchResult.state === 0 ? 'bg-yellow-100 text-yellow-800' :
                      searchResult.state === 1 ? 'bg-green-100 text-green-800' :
                      searchResult.state === 2 ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {searchResult.state === 0 ? 'EN NOTARÍA' :
                       searchResult.state === 1 ? 'VALIDADO' :
                       searchResult.state === 2 ? 'REGISTRADO' : 'DESCONOCIDO'}
                    </Badge>
                  </div>

                  {/* Token ID */}
                  <div className="space-y-2">
                    <span className="font-medium text-purple-700">Token ID:</span>
                    <div className="flex items-center space-x-2 bg-white border border-purple-200 rounded-md p-3">
                      <p className="text-purple-900 font-mono flex-1 break-all text-sm">{searchResult.tokenId}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(searchResult.tokenId)}
                        className="border-purple-300 text-purple-600 hover:bg-purple-100 flex-shrink-0"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Propietario */}
                  <div className="space-y-2">
                    <span className="font-medium text-purple-700">Propietario:</span>
                    <div className="flex items-center space-x-2 bg-white border border-purple-200 rounded-md p-3">
                      <p className="text-purple-900 font-mono flex-1 break-all text-sm">{searchResult.owner}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(searchResult.owner)}
                        className="border-purple-300 text-purple-600 hover:bg-purple-100 flex-shrink-0"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* URI */}
                  <div className="space-y-2">
                    <span className="font-medium text-purple-700">URI:</span>
                    <div className="flex items-center space-x-2 bg-white border border-purple-200 rounded-md p-3">
                      <p className="text-purple-900 font-mono flex-1 break-all text-sm">{searchResult.uri || 'N/A'}</p>
                      {searchResult.uri && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(searchResult.uri)}
                          className="border-purple-300 text-purple-600 hover:bg-purple-100 flex-shrink-0"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Botón de registro - solo aparece si está VALIDADO */}
                  {searchResult.state === 1 && (
                    <div className="pt-4 border-t border-purple-200">
                      <Alert className="mb-4">
                        <Shield className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Lista para registro:</strong> Esta propiedad ha sido validada por una notaría 
                          y está lista para el registro oficial en DDRR.
                        </AlertDescription>
                      </Alert>
                      
                      <Button 
                        onClick={registerProperty}
                        disabled={registerLoading}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        size="lg"
                      >
                        {registerLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Registrando...</span>
                          </div>
                        ) : (
                          <>
                            <Building2 className="w-4 h-4 mr-2" />
                            Registrar Oficialmente
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Mensaje si ya está registrado */}
                  {searchResult.state === 2 && (
                    <div className="pt-4 border-t border-purple-200">
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Ya registrado:</strong> Esta propiedad ya ha sido registrada oficialmente en DDRR.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {/* Mensaje si no está validado */}
                  {searchResult.state === 0 && (
                    <div className="pt-4 border-t border-purple-200">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Pendiente de validación:</strong> Esta propiedad aún no ha sido validada por una notaría.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
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
      )}

      {/* Información sobre el proceso DDRR */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">¿Qué hace DDRR en el proceso?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-purple-800">1. Verificación</h3>
              <p className="text-sm text-gray-600 mt-2">
                Busca y verifica propiedades que han sido validadas por notarías autorizadas
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-purple-800">2. Registro Oficial</h3>
              <p className="text-sm text-gray-600 mt-2">
                Establece el registro definitivo, cambiando el estado a "REGISTRADO" en la blockchain
              </p>
            </div>
          </div>

          <Alert>
            <Building2 className="h-4 w-4" />
            <AlertDescription>
              <strong>Rol importante:</strong> Como DDRR, eres el último eslabón en el proceso de registro. 
              Tu función es dar el registro oficial definitivo a las propiedades validadas por notarías.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}

export default DDRRPanel

