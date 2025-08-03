import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Wallet, Search, CheckCircle, Clock, FileText } from 'lucide-react';
import blockchainService from '../utils/blockchain';

const BlockchainPanel = ({ userRole = 'OBSERVADOR' }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');

  // Estados para consultar propiedad
  const [queryTokenId, setQueryTokenId] = useState('');
  const [propertyData, setPropertyData] = useState(null);

  useEffect(() => {
    // El useEffect puede estar vacío por ahora o removerse completamente
  }, []);

  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
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
      const property = await blockchainService.getPropertyInfo(parseInt(queryTokenId));
      
      setPropertyData({
        tokenId: queryTokenId,
        owner: property.owner,
        state: property.state,
        uri: property.uri,
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
                <div className="md:col-span-2">
                  <p className="font-medium">URI de Metadatos:</p>
                  <p className="text-gray-600 font-mono break-all">{propertyData.uri}</p>
                </div>
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
    </div>
  );
};

export default BlockchainPanel;

