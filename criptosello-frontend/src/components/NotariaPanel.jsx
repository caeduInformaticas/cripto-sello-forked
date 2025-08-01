import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppContext } from '../App'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, ArrowLeft, LogOut, Shield, FileText, Blockchain } from 'lucide-react'
import BlockchainPanel from './BlockchainPanel'

const NotariaPanel = () => {
  const { user, setUser, propiedades, loadPropiedades, loading } = useAppContext()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user || user.rol !== 'NOTARIA') {
      navigate('/auth?role=NOTARIA')
      return
    }
    loadPropiedades()
  }, [user, navigate, loadPropiedades])

  const handleLogout = () => {
    setUser(null)
    navigate('/')
  }

  if (!user) {
    return null
  }

  const propiedadesEnNotaria = propiedades.filter(p => p.estado === 'EN_NOTARIA')
  const propiedadesValidadas = propiedades.filter(p => p.estado === 'VALIDADO')

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">CriptoSello</h1>
              <span className="text-sm text-gray-500">- Panel Notaría</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Bienvenido, {user.nombre}
              </span>
              <Link to="/">
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Inicio</span>
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Panel de Notaría
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Gestiona la validación de documentos y el registro de propiedades en la blockchain
            </p>
          </div>

          <Tabs defaultValue="blockchain" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="blockchain" className="flex items-center space-x-2">
                <Blockchain className="h-4 w-4" />
                <span>Blockchain</span>
              </TabsTrigger>
              <TabsTrigger value="pendientes" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Pendientes ({propiedadesEnNotaria.length})</span>
              </TabsTrigger>
              <TabsTrigger value="validadas" className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Validadas ({propiedadesValidadas.length})</span>
              </TabsTrigger>
            </TabsList>

            {/* Panel de Blockchain */}
            <TabsContent value="blockchain">
              <Card>
                <CardHeader>
                  <CardTitle>Gestión Blockchain</CardTitle>
                  <CardDescription>
                    Crea nuevas propiedades y valida documentos directamente en la blockchain
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BlockchainPanel userRole="NOTARIA" />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Propiedades Pendientes */}
            <TabsContent value="pendientes">
              <Card>
                <CardHeader>
                  <CardTitle>Propiedades Pendientes de Validación</CardTitle>
                  <CardDescription>
                    Documentos que requieren tu validación antes de continuar el proceso
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Cargando propiedades...</p>
                    </div>
                  ) : propiedadesEnNotaria.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No hay propiedades pendientes de validación</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {propiedadesEnNotaria.map((propiedad) => (
                        <div key={propiedad.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg">{propiedad.titulo}</h3>
                              <p className="text-gray-600">{propiedad.descripcion}</p>
                              <p className="text-sm text-gray-500">
                                Propietario: {propiedad.propietario?.nombre}
                              </p>
                            </div>
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                              En Notaría
                            </span>
                          </div>
                          
                          {propiedad.documentos && propiedad.documentos.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Documentos:</p>
                              <div className="space-y-1">
                                {propiedad.documentos.map((doc, index) => (
                                  <div key={index} className="text-sm text-gray-600 flex items-center space-x-2">
                                    <FileText className="h-4 w-4" />
                                    <span>{doc.nombre}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex space-x-2 pt-2">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              Validar Documentos
                            </Button>
                            <Button size="sm" variant="outline">
                              Ver Detalles
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Propiedades Validadas */}
            <TabsContent value="validadas">
              <Card>
                <CardHeader>
                  <CardTitle>Propiedades Validadas</CardTitle>
                  <CardDescription>
                    Propiedades que has validado y están listas para el registro en DDRR
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Cargando propiedades...</p>
                    </div>
                  ) : propiedadesValidadas.length === 0 ? (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No hay propiedades validadas</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {propiedadesValidadas.map((propiedad) => (
                        <div key={propiedad.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg">{propiedad.titulo}</h3>
                              <p className="text-gray-600">{propiedad.descripcion}</p>
                              <p className="text-sm text-gray-500">
                                Propietario: {propiedad.propietario?.nombre}
                              </p>
                            </div>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                              Validado
                            </span>
                          </div>
                          
                          <div className="flex space-x-2 pt-2">
                            <Button size="sm" variant="outline">
                              Ver Detalles
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

export default NotariaPanel

