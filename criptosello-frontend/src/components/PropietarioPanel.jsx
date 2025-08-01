import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../App'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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

const PropietarioPanel = () => {
  const navigate = useNavigate()
  const { user, setUser, propiedades, loadPropiedades, apiService } = useAppContext()
  
  const [showNewPropertyForm, setShowNewPropertyForm] = useState(false)
  const [newProperty, setNewProperty] = useState({
    direccion: '',
    folioReal: '',
    descripcion: '',
    documentos: []
  })

  useEffect(() => {
    if (!user || user.rol !== 'PROPIETARIO') {
      navigate('/auth?role=PROPIETARIO')
    }
  }, [user, navigate])

  const handleLogout = () => {
    setUser(null)
    navigate('/')
  }

  const handleInputChange = (e) => {
    setNewProperty({
      ...newProperty,
      [e.target.name]: e.target.value
    })
  }

  const handleFileUpload = (e, tipo) => {
    const files = Array.from(e.target.files)
    const newDocuments = files.map(file => ({
      id: Date.now() + Math.random(),
      nombre: file.name,
      tipo: tipo,
      archivo: file,
      fechaSubida: new Date()
    }))
    
    setNewProperty({
      ...newProperty,
      documentos: [...newProperty.documentos, ...newDocuments]
    })
  }

  const removeDocument = (docId) => {
    setNewProperty({
      ...newProperty,
      documentos: newProperty.documentos.filter(doc => doc.id !== docId)
    })
  }

  const handleSubmitProperty = async (e) => {
    e.preventDefault()
    
    try {
      const propertyData = {
        direccion: newProperty.direccion,
        folioReal: newProperty.folioReal,
        propietarioId: user.id,
        propietarioNombre: user.nombre,
        descripcion: newProperty.descripcion,
        documentos: newProperty.documentos.map(doc => ({
          nombre: doc.nombre,
          tipo: doc.tipo,
          url: doc.url || ''
        }))
      }
      
      await apiService.createPropiedad(propertyData)
      
      // Recargar propiedades
      await loadPropiedades()
      
      // Limpiar formulario
      setNewProperty({
        direccion: '',
        folioReal: '',
        descripcion: '',
        documentos: []
      })
      setShowNewPropertyForm(false)
      
      alert('Propiedad registrada exitosamente')
    } catch (error) {
      console.error('Error creando propiedad:', error)
      alert(error.message || 'Error al registrar la propiedad')
    }
  }

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
          <Button 
            onClick={() => setShowNewPropertyForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Propiedad
          </Button>
        </div>

        {/* Formulario Nueva Propiedad */}
        {showNewPropertyForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Registrar Nueva Propiedad</CardTitle>
              <CardDescription>
                Completa la información y sube los documentos requeridos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitProperty} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="direccion">Dirección de la Propiedad</Label>
                    <Input
                      id="direccion"
                      name="direccion"
                      placeholder="Av. Ejemplo 123, Zona Centro"
                      value={newProperty.direccion}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="folioReal">Folio Real</Label>
                    <Input
                      id="folioReal"
                      name="folioReal"
                      placeholder="FR-2024-001234"
                      value={newProperty.folioReal}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción (Opcional)</Label>
                  <Textarea
                    id="descripcion"
                    name="descripcion"
                    placeholder="Casa de dos plantas, 3 dormitorios..."
                    value={newProperty.descripcion}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>

                {/* Subida de Documentos */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Documentos Requeridos</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Cédula de Identidad</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, 'CI')}
                          className="hidden"
                          id="ci-upload"
                        />
                        <label htmlFor="ci-upload" className="cursor-pointer">
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Subir CI</p>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Planos</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, 'PLANO')}
                          className="hidden"
                          id="plano-upload"
                        />
                        <label htmlFor="plano-upload" className="cursor-pointer">
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Subir Planos</p>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Folio Real Original</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, 'FOLIO_REAL')}
                          className="hidden"
                          id="folio-upload"
                        />
                        <label htmlFor="folio-upload" className="cursor-pointer">
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Subir Folio</p>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Lista de documentos subidos */}
                  {newProperty.documentos.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-medium">Documentos Subidos:</h5>
                      <div className="space-y-2">
                        {newProperty.documentos.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">{doc.nombre}</span>
                              <Badge variant="outline">{doc.tipo}</Badge>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument(doc.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Eliminar
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex space-x-4">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Registrar Propiedad
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowNewPropertyForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
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

