import { Alert, AlertDescription } from './ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import pinataService from '../services/pinataService'

const PinataSetup = () => {
  const hasJWT = !!import.meta.env.VITE_PINATA_JWT
  const hasApiKeys = !!(import.meta.env.VITE_PINATA_API_KEY && import.meta.env.VITE_PINATA_SECRET_API_KEY)
  const isConfigured = pinataService.isConfiguredCorrectly()

  return (
    <div className="space-y-4">
      {/* Estado actual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Estado de Pinata Cloud 
            {isConfigured ? (
              <Badge variant="default" className="bg-green-500">Configurado</Badge>
            ) : (
              <Badge variant="secondary">Modo Demo</Badge>
            )}
          </CardTitle>
          <CardDescription>
            {isConfigured 
              ? "Pinata Cloud está configurado correctamente" 
              : "Funcionando en modo demo - los archivos no se suben a IPFS real"
            }
          </CardDescription>
        </CardHeader>
        {!isConfigured && (
          <CardContent>
            <Alert>
              <AlertDescription>
                <strong>Modo Demo Activo:</strong> Puedes probar toda la funcionalidad, pero los archivos 
                no se guardarán realmente en IPFS. Para usar IPFS real, configura tus credenciales de Pinata.
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* Instrucciones solo si no está configurado */}
      {!isConfigured && (
        <Card>
          <CardHeader>
            <CardTitle>Configurar Pinata Cloud (Opcional)</CardTitle>
            <CardDescription>
              Para subir archivos reales a IPFS, necesitas credenciales de Pinata Cloud
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">1. Crear cuenta en Pinata</h4>
              <p className="text-sm text-muted-foreground">
                Ve a <a href="https://pinata.cloud" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                pinata.cloud
                </a> y crea una cuenta gratuita.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">2. Obtener credenciales</h4>
              <p className="text-sm text-muted-foreground">
                Tienes dos opciones para autenticación:
              </p>
              
              <div className="ml-4 space-y-2">
                <div>
                  <p className="text-sm font-medium">Opción A: JWT Token (Recomendado)</p>
                  <p className="text-xs text-muted-foreground">
                    Ve a API Keys {">"} Create New Key {">"} Genera un JWT token
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Opción B: API Key + Secret</p>
                  <p className="text-xs text-muted-foreground">
                    Ve a API Keys {">"} Create New Key {">"} Obtén API Key y Secret
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">3. Configurar en el proyecto</h4>
              <p className="text-sm text-muted-foreground">
                Crea o edita el archivo <code className="bg-muted px-1 rounded">.env</code> en la raíz del proyecto:
              </p>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Para JWT Token:</p>
                  <pre className="bg-muted p-2 rounded text-sm">
VITE_PINATA_JWT=tu_jwt_token_aqui
                  </pre>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Para API Key + Secret:</p>
                  <pre className="bg-muted p-2 rounded text-sm">
VITE_PINATA_API_KEY=tu_api_key_aqui
VITE_PINATA_SECRET_API_KEY=tu_secret_key_aqui
                  </pre>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Reinicia el servidor de desarrollo después de agregar las credenciales.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">4. Verificar configuración</h4>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  JWT configurado: {hasJWT ? '✅ Sí' : '❌ No'}
                </p>
                <p className="text-xs text-muted-foreground">
                  API Keys configuradas: {hasApiKeys ? '✅ Sí' : '❌ No'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Estado: {isConfigured ? '✅ Listo para usar' : '⚠️ Modo demo'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información sobre Pinata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sobre Pinata Cloud</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Pinata es un servicio de almacenamiento IPFS que ofrece:
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>Almacenamiento permanente en IPFS</li>
            <li>Gateways rápidos para acceso a archivos</li>
            <li>API fácil de usar</li>
            <li>Plan gratuito disponible</li>
            <li>Ideal para NFTs y dApps</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export default PinataSetup
