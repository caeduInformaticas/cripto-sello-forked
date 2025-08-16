import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Wallet, Plus, Search, CheckCircle, Clock, FileText } from 'lucide-react';
import blockchainService from '../utils/blockchain';

const BlockchainPanel = ({ userRole = 'OBSERVADOR' }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');

  // Estados para crear propiedad
  const [newProperty, setNewProperty] = useState({
    to: '',
    tokenId: '',
    ownerInfo: '',
    details: '',
    legalDocsHash: ''
  });

  // Estados para consultar propiedad
  const [queryTokenId, setQueryTokenId] = useState('');
  const [propertyData, setPropertyData] = useState(null);
  const [recentProperties, setRecentProperties] = useState([]);

  useEffect(() => {
    // Intentar conectar automáticamente al nodo local para desarrollo
    connectToBlockchain();
  }, []);

  useEffect(() => {
    // Configurar listeners de eventos cuando esté conectado
    if (isConnected) {
      setupEventListeners();
    }

    // Limpiar listeners al desmontar
    return () => {
      blockchainService.removeAllListeners();
    };
  }, [isConnected]);

  const setupEventListeners = () => {
    // Escuchar cuando se registra una nueva propiedad
    blockchainService.onPropertyRegistered((tokenId, owner, ownerInfo, details, legalDocsHash, event) => {
      console.log('🏠 Nueva propiedad registrada:', {
        tokenId: tokenId.toString(),
        owner,
        ownerInfo,
        details
      });

      // Agregar a la lista de propiedades recientes
      const newProperty = {
        tokenId: tokenId.toString(),
        owner,
        ownerInfo,
        details,
        legalDocsHash,
        timestamp: new Date(),
        state: 0,
        stateText: 'En Notaría'
      };

      setRecentProperties(prev => [newProperty, ...prev.slice(0, 4)]); // Mantener solo 5
      
      // Mostrar los detalles completos automáticamente
      setPropertyData({
        tokenId: tokenId.toString(),
        owner,
        ownerInfo,
        details,
        legalDocsHash,
        state: 0,
        stateText: 'En Notaría'
      });
      
      // Auto-llenar el campo de consulta con el nuevo ID
      setQueryTokenId(tokenId.toString());
      
      // Mostrar notificación con todos los detalles
      showMessage(`🎉 Propiedad #${tokenId} creada exitosamente! Ver detalles completos abajo.`, 'success');
    });

    // Escuchar cambios de estado
    blockchainService.onPropertyStateChanged((tokenId, newState, event) => {
      console.log('🔄 Estado cambió:', {
        tokenId: tokenId.toString(),
        newState: newState.toString()
      });

      // Actualizar la lista de propiedades recientes
      setRecentProperties(prev => 
        prev.map(prop => 
          prop.tokenId === tokenId.toString() 
            ? { ...prop, state: newState, stateText: blockchainService.getPropertyStateText(newState) }
            : prop
        )
      );

      showMessage(`🔄 Propiedad #${tokenId} cambió a: ${blockchainService.getPropertyStateText(newState)}`, 'info');
    });
  };

  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const connectToBlockchain = async () => {
    try {
      setLoading(true);
      
      // Intentar conectar al nodo local primero (para desarrollo)
      const address = await blockchainService.connectToLocalNode();
      setAccount(address);
      setIsConnected(true);
      showMessage('Conectado a la blockchain local', 'success');
    } catch (error) {
      console.error('Error conectando a blockchain:', error);
      showMessage('Error conectando a la blockchain', 'error');
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      setLoading(true);
      const address = await blockchainService.connectWallet();
      setAccount(address);
      setIsConnected(true);
      showMessage('Wallet conectado exitosamente', 'success');
    } catch (error) {
      console.error('Error conectando wallet:', error);
      showMessage('Error conectando wallet: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const createProperty = async () => {
    if (!isConnected) {
      showMessage('Primero conecta tu wallet', 'error');
      return;
    }

    if (!newProperty.to || !newProperty.tokenId || !newProperty.ownerInfo || !newProperty.details) {
      showMessage('Completa todos los campos requeridos', 'error');
      return;
    }

    try {
      setLoading(true);
      await blockchainService.createProperty(
        newProperty.to,
        parseInt(newProperty.tokenId),
        newProperty.ownerInfo,
        newProperty.details,
        newProperty.legalDocsHash || ''
      );
      
      showMessage('Propiedad creada exitosamente', 'success');
      setNewProperty({
        to: '',
        tokenId: '',
        ownerInfo: '',
        details: '',
        legalDocsHash: ''
      });
    } catch (error) {
      console.error('Error creando propiedad:', error);
      showMessage('Error creando propiedad: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const validateProperty = async (tokenId) => {
    if (!isConnected) {
      showMessage('Primero conecta tu wallet', 'error');
      return;
    }

    try {
      setLoading(true);
      await blockchainService.validateProperty(parseInt(tokenId));
      showMessage('Propiedad validada exitosamente', 'success');
      
      // Actualizar datos si estamos viendo esta propiedad
      if (propertyData && propertyData.tokenId === tokenId) {
        await queryProperty();
      }
    } catch (error) {
      console.error('Error validando propiedad:', error);
      showMessage('Error validando propiedad: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const registerProperty = async (tokenId) => {
    if (!isConnected) {
      showMessage('Primero conecta tu wallet', 'error');
      return;
    }

    try {
      setLoading(true);
      await blockchainService.registerProperty(parseInt(tokenId));
      showMessage('Propiedad registrada exitosamente', 'success');
      
      // Actualizar datos si estamos viendo esta propiedad
      if (propertyData && propertyData.tokenId === tokenId) {
        await queryProperty();
      }
    } catch (error) {
      console.error('Error registrando propiedad:', error);
      showMessage('Error registrando propiedad: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const queryProperty = async () => {
    if (!queryTokenId) {
      showMessage('Ingresa un ID de token válido', 'error');
      return;
    }

    try {
      setLoading(true);
      const property = await blockchainService.getProperty(parseInt(queryTokenId));
      const owner = await blockchainService.getOwnerOf(parseInt(queryTokenId));
      
      setPropertyData({
        tokenId: queryTokenId,
        owner,
        ownerInfo: property.ownerInfo,
        details: property.details,
        legalDocsHash: property.legalDocsHash,
        state: property.state,
        stateText: blockchainService.getPropertyStateText(property.state)
      });
      
      showMessage('Propiedad encontrada', 'success');
    } catch (error) {
      console.error('Error consultando propiedad:', error);
      showMessage('Error consultando propiedad: ' + error.message, 'error');
      setPropertyData(null);
    } finally {
      setLoading(false);
    }
  };

  const getStateColor = (state) => {
    switch (state) {
      case 0: return 'bg-yellow-100 text-yellow-800';
      case 1: return 'bg-blue-100 text-blue-800';
      case 2: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStateIcon = (state) => {
    switch (state) {
      case 0: return <Clock className="w-4 h-4" />;
      case 1: return <FileText className="w-4 h-4" />;
      case 2: return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Mensaje de estado */}
      {message && (
        <Alert className={messageType === 'error' ? 'border-red-500 bg-red-50' : messageType === 'success' ? 'border-green-500 bg-green-50' : 'border-blue-500 bg-blue-50'}>
          <AlertDescription className={messageType === 'error' ? 'text-red-700' : messageType === 'success' ? 'text-green-700' : 'text-blue-700'}>
            {message}
          </AlertDescription>
        </Alert>
      )}

      {/* Estado de conexión */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Conexión Blockchain
          </CardTitle>
          <CardDescription>
            Estado de la conexión con la red blockchain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Estado:</p>
              <Badge variant={isConnected ? 'default' : 'secondary'}>
                {isConnected ? 'Conectado' : 'Desconectado'}
              </Badge>
            </div>
            {!isConnected && (
              <div className="space-x-2">
                <Button onClick={connectToBlockchain} disabled={loading}>
                  Conectar Local
                </Button>
                <Button onClick={connectWallet} disabled={loading} variant="outline">
                  Conectar Wallet
                </Button>
              </div>
            )}
          </div>
          
          {isConnected && account && (
            <div>
              <p className="text-sm font-medium">Cuenta:</p>
              <p className="text-sm text-gray-600 font-mono break-all">{account}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Panel para crear propiedad (solo notarios) */}
      {userRole === 'NOTARIA' && isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Crear Nueva Propiedad
            </CardTitle>
            <CardDescription>
              Registra una nueva propiedad en la blockchain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="to">Dirección del Propietario *</Label>
                <Input
                  id="to"
                  placeholder="0x..."
                  value={newProperty.to}
                  onChange={(e) => setNewProperty({...newProperty, to: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="tokenId">ID del Token *</Label>
                <Input
                  id="tokenId"
                  type="number"
                  placeholder="123"
                  value={newProperty.tokenId}
                  onChange={(e) => setNewProperty({...newProperty, tokenId: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="ownerInfo">Información del Propietario *</Label>
              <Input
                id="ownerInfo"
                placeholder="Juan Pérez - CI: 12345678"
                value={newProperty.ownerInfo}
                onChange={(e) => setNewProperty({...newProperty, ownerInfo: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="details">Detalles de la Propiedad *</Label>
              <Textarea
                id="details"
                placeholder="Casa de 2 pisos, 150m², Zona Sur, La Paz"
                value={newProperty.details}
                onChange={(e) => setNewProperty({...newProperty, details: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="legalDocsHash">Hash de Documentos Legales</Label>
              <Input
                id="legalDocsHash"
                placeholder="QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={newProperty.legalDocsHash}
                onChange={(e) => setNewProperty({...newProperty, legalDocsHash: e.target.value})}
              />
            </div>
            
            <Button onClick={createProperty} disabled={loading} className="w-full">
              {loading ? 'Creando...' : 'Crear Propiedad'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Panel de consulta de propiedades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Consultar Propiedad
          </CardTitle>
          <CardDescription>
            Busca información de una propiedad por su ID de token
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="ID del Token"
              type="number"
              value={queryTokenId}
              onChange={(e) => setQueryTokenId(e.target.value)}
            />
            <Button onClick={queryProperty} disabled={loading || !isConnected}>
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
          
          {propertyData && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Propiedad #{propertyData.tokenId}</h3>
                <Badge className={`${getStateColor(propertyData.state)} flex items-center gap-1`}>
                  {getStateIcon(propertyData.state)}
                  {propertyData.stateText}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Propietario:</p>
                  <p className="text-gray-600 font-mono break-all">{propertyData.owner}</p>
                </div>
                <div>
                  <p className="font-medium">Información del Propietario:</p>
                  <p className="text-gray-600">{propertyData.ownerInfo}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="font-medium">Detalles:</p>
                  <p className="text-gray-600">{propertyData.details}</p>
                </div>
                {propertyData.legalDocsHash && (
                  <div className="md:col-span-2">
                    <p className="font-medium">Hash de Documentos:</p>
                    <p className="text-gray-600 font-mono break-all">{propertyData.legalDocsHash}</p>
                  </div>
                )}
              </div>
              
              {/* Botones de acción según el rol y estado */}
              <div className="flex gap-2 pt-2">
                {userRole === 'NOTARIA' && propertyData.state === 0 && (
                  <Button 
                    onClick={() => validateProperty(propertyData.tokenId)} 
                    disabled={loading}
                    size="sm"
                  >
                    Validar Propiedad
                  </Button>
                )}
                {userRole === 'DDRR' && propertyData.state === 1 && (
                  <Button 
                    onClick={() => registerProperty(propertyData.tokenId)} 
                    disabled={loading}
                    size="sm"
                  >
                    Registrar Propiedad
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Panel de propiedades recientes */}
      {recentProperties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Propiedades Recientes
            </CardTitle>
            <CardDescription>
              Propiedades creadas recientemente en esta sesión
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentProperties.map((property, index) => (
                <div 
                  key={`${property.tokenId}-${index}`}
                  className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    setQueryTokenId(property.tokenId.toString());
                    queryProperty(property.tokenId);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Propiedad #{property.tokenId}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Nuevo
                    </Badge>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <p><span className="font-medium">Propietario:</span> {property.ownerInfo}</p>
                    <p className="text-xs font-mono text-gray-500 mt-1">
                      {property.owner.slice(0, 10)}...{property.owner.slice(-8)}
                    </p>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Haz clic para ver detalles completos
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t text-center">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setRecentProperties([])}
              >
                Limpiar Lista
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BlockchainPanel;

