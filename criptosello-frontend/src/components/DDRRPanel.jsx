import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppContext } from '../App'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, ArrowLeft, LogOut, CheckCircle, FileText, Blockchain } from 'lucide-react'
import BlockchainPanel from './BlockchainPanel'

const DDRRPanel = () => {
  const { user, setUser, propiedades, loadPropiedades, loading } = useAppContext()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user || user.rol !== 'DDRR') {
      navigate('/auth?role=DDRR')
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

  const propiedadesValidadas = propiedades.filter(p => p.estado === 'VALIDADO')
  const propiedadesRegistradas = propiedades.filter(p => p.estado === 'REGISTRADO')

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">CriptoSello</h1>
              <span className="text-sm text-gray-500">- Panel DDRR</span>
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
              Panel de Derechos Reales (DDRR)
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Registra oficialmente las propiedades validadas en la blockchain
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
                <span>Para Registrar ({propiedadesValidadas.length})</span>
              </TabsTrigger>
              <TabsTrigger value="registradas" className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Registradas ({propiedadesRegistradas.length})</span>
              </TabsTrigger>
            </TabsList>

            {/* Panel de Blockchain */}
            <TabsContent value="blockchain">
              <Card>
                <CardHeader>
                  <CardTitle>Gestión Blockchain</CardTitle>
                  <CardDescription>
                    Registra propiedades validadas directamente en la blockchain
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BlockchainPanel userRole="DDRR" />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Propiedades Para Registrar */}
            <TabsContent value="pendientes">
              <Card>
                <CardHeader>
                  <CardTitle>Propiedades Validadas para Registro</CardTitle>
                  <CardDescription>
                    Propiedades que han sido validadas por notarías y están listas para el registro oficial
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Cargando propiedades...</p>
                    </div>
                  ) : propiedadesValidadas.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No hay propiedades pendientes de registro</p>
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
                              <p className="text-sm text-gray-500">
                                Validado por: {propiedad.notaria?.nombre}
                              </p>
                            </div>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                              Validado
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
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                              Registrar Oficialmente
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

            {/* Propiedades Registradas */}
            <TabsContent value="registradas">
              <Card>
                <CardHeader>
                  <CardTitle>Propiedades Registradas</CardTitle>
                  <CardDescription>
                    Propiedades que han completado todo el proceso y están oficialmente registradas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Cargando propiedades...</p>
                    </div>
                  ) : propiedadesRegistradas.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No hay propiedades registradas</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {propiedadesRegistradas.map((propiedad) => (
                        <div key={propiedad.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg">{propiedad.titulo}</h3>
                              <p className="text-gray-600">{propiedad.descripcion}</p>
                              <p className="text-sm text-gray-500">
                                Propietario: {propiedad.propietario?.nombre}
                              </p>
                              <p className="text-sm text-gray-500">
                                Registrado el: {new Date(propiedad.fecha_registro).toLocaleDateString()}
                              </p>
                            </div>
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                              Registrado
                            </span>
                          </div>
                          
                          <div className="flex space-x-2 pt-2">
                            <Button size="sm" variant="outline">
                              Ver Certificado
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
          </Tabs>
        </div>
      </main>
    </div>
  )
}

export default DDRRPanel

