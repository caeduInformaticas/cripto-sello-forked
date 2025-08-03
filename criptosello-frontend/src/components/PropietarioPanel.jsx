import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../App'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  Upload, 
  FileText, 
  CheckCircle, 
  Clock, 
  Plus,
  LogOut,
  User
} from 'lucide-react'
import PropertyRegistrationFormSimple from './PropertyRegistrationFormSimple'
import PinataSetup from './PinataSetup'

const PropietarioPanel = () => {
  const navigate = useNavigate()
  const { user, setUser, propiedades, loadPropiedades, apiService } = useAppContext()
  
  const [showNewPropertyForm, setShowNewPropertyForm] = useState(false)
  const [showPinataSetup, setShowPinataSetup] = useState(false)

  useEffect(() => {
    if (!user || user.rol !== 'PROPIETARIO') {
      navigate('/auth?role=PROPIETARIO')
    }
  }, [user, navigate])

  const handleLogout = () => {
    setUser(null)
    navigate('/')
  }

  const handleRegistrationComplete = (contractData) => {
    console.log('Datos listos para el contrato:', contractData)
    
    // Aquí puedes integrar con el contrato blockchain
    // Ejemplo de llamada al contrato:
    /*
    const mintProperty = async () => {
      try {
        // Llamar a la función mint del contrato
        const tx = await contract.mintProperty(
          contractData.tokenURI,           // URI de IPFS
          contractData.carnetIdentidad,    // CI del propietario
          contractData.description         // Descripción
        )
        
        await tx.wait()
        console.log('Propiedad minted exitosamente:', tx.hash)
      } catch (error) {
        console.error('Error al mint:', error)
      }
    }
    
    mintProperty()
    */
    
    // Por ahora solo mostrar los datos
    alert(`Datos preparados para el contrato:\n\nToken URI: ${contractData.tokenURI}\nCarnet: ${contractData.carnetIdentidad}\nDescripción: ${contractData.description}`)
    
    // Cerrar el formulario
    setShowNewPropertyForm(false)
    
    // Recargar propiedades si tienes esa función
    if (loadPropiedades) {
      loadPropiedades()
    }
  }

  // Funciones para la lista de propiedades existentes
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'EN_NOTARIA':
        return 'bg-yellow-100 text-yellow-800'
      case 'VALIDADO':
        return 'bg-blue-100 text-blue-800'
      case 'REGISTRADO':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgressValue = (estado) => {
    switch (estado) {
      case 'EN_NOTARIA':
        return 33
      case 'VALIDADO':
        return 66
      case 'REGISTRADO':
        return 100
      default:
        return 0
    }
  }

  const userProperties = propiedades.filter(p => p.propietarioId === user?.id)

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">CriptoSello</h1>
              <span className="text-gray-500">- Panel Propietario</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{user.nombre}</span>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Mis Propiedades</h2>
            <p className="text-gray-600 mt-2">
              Gestiona y da seguimiento a tus propiedades registradas
            </p>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline"
              onClick={() => setShowPinataSetup(true)}
              className="text-gray-600 border-gray-300"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Configurar IPFS
            </Button>
            <Button 
              onClick={() => setShowNewPropertyForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Propiedad
            </Button>
          </div>
        </div>

        {/* Formulario Nueva Propiedad */}
        {showNewPropertyForm && (
          <div className="mb-8">
            <PropertyRegistrationFormSimple 
              onRegistrationComplete={handleRegistrationComplete}
            />
            <div className="mt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowNewPropertyForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Configuración de Pinata */}
        {showPinataSetup && (
          <div className="mb-8">
            <PinataSetup />
            <div className="mt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowPinataSetup(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}

        {/* Lista de Propiedades */}
        <div className="space-y-6">
          {userProperties.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No tienes propiedades registradas
                </h3>
                <p className="text-gray-600 mb-4">
                  Comienza registrando tu primera propiedad
                </p>
                <Button 
                  onClick={() => setShowNewPropertyForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Primera Propiedad
                </Button>
              </CardContent>
            </Card>
          ) : (
            userProperties.map(property => (
              <Card key={property.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{property.direccion}</CardTitle>
                      <CardDescription>
                        Folio Real: {property.folioReal}
                      </CardDescription>
                    </div>
                    <Badge className={getEstadoColor(property.estado)}>
                      {property.estado.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Barra de Progreso */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span>Progreso del Registro</span>
                      <span>{getProgressValue(property.estado)}%</span>
                    </div>
                    <Progress value={getProgressValue(property.estado)} className="h-2" />
                    
                    {/* Estados del proceso */}
                    <div className="flex justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>En Notaría</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CheckCircle className={`h-3 w-3 ${property.estado === 'VALIDADO' || property.estado === 'REGISTRADO' ? 'text-blue-600' : ''}`} />
                        <span>Validado</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CheckCircle className={`h-3 w-3 ${property.estado === 'REGISTRADO' ? 'text-green-600' : ''}`} />
                        <span>Registrado</span>
                      </div>
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Fecha de Registro:</span>
                      <p className="text-gray-600">
                        {new Date(property.fechaCreacion).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Documentos:</span>
                      <p className="text-gray-600">
                        {property.documentos.length} archivo(s) subido(s)
                      </p>
                    </div>
                  </div>

                  {property.descripcion && (
                    <div className="mt-4">
                      <span className="font-medium text-sm">Descripción:</span>
                      <p className="text-gray-600 text-sm mt-1">{property.descripcion}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default PropietarioPanel

