import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Shield, Users, Search, FileText, CheckCircle } from 'lucide-react'

const Homepage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">CriptoSello</h1>
            </div>
            <Link to="/consulta">
              <Button variant="outline" className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Consulta Pública</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Modernizando el Registro de Propiedades
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            CriptoSello es una plataforma digital que simplifica y agiliza el proceso de 
            registro y validación de propiedades, conectando propietarios, notarías y 
            Derechos Reales en un flujo transparente y eficiente.
          </p>
          
          {/* Proceso Visual */}
          <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8 mb-12">
            <div className="flex items-center space-x-2 bg-white p-4 rounded-lg shadow-sm">
              <FileText className="h-6 w-6 text-blue-600" />
              <span className="font-medium">Propietario Sube Documentos</span>
            </div>
            <div className="hidden md:block text-gray-400">→</div>
            <div className="flex items-center space-x-2 bg-white p-4 rounded-lg shadow-sm">
              <Shield className="h-6 w-6 text-green-600" />
              <span className="font-medium">Notaría Valida</span>
            </div>
            <div className="hidden md:block text-gray-400">→</div>
            <div className="flex items-center space-x-2 bg-white p-4 rounded-lg shadow-sm">
              <CheckCircle className="h-6 w-6 text-purple-600" />
              <span className="font-medium">DDRR Registra</span>
            </div>
          </div>
        </div>
      </section>

      {/* Accesos Rápidos */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Accede según tu Rol
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Propietario */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Soy Propietario</CardTitle>
                <CardDescription>
                  Registra y da seguimiento a tus propiedades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/auth?role=PROPIETARIO" className="w-full">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Acceder
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Notaría */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">Soy Notaría</CardTitle>
                <CardDescription>
                  Valida documentos y autoriza registros
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/auth?role=NOTARIA" className="w-full">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Acceder
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* DDRR */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                  <Building2 className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Soy DDRR</CardTitle>
                <CardDescription>
                  Registra oficialmente las propiedades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/auth?role=DDRR" className="w-full">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    Acceder
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Observador */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
                  <Search className="h-8 w-8 text-gray-600" />
                </div>
                <CardTitle className="text-xl">Consulta Pública</CardTitle>
                <CardDescription>
                  Verifica información de propiedades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/consulta" className="w-full">
                  <Button variant="outline" className="w-full">
                    Consultar
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-12">
            Beneficios de CriptoSello
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Transparencia</h4>
              <p className="text-gray-600">
                Seguimiento en tiempo real del estado de tu propiedad
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Seguridad</h4>
              <p className="text-gray-600">
                Validación institucional y registro inmutable
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Eficiencia</h4>
              <p className="text-gray-600">
                Proceso digital que reduce tiempos y trámites
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-4xl mx-auto text-center px-4">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Building2 className="h-6 w-6" />
            <span className="text-xl font-bold">CriptoSello</span>
          </div>
          <p className="text-gray-400">
            Modernizando el registro de propiedades para un futuro más transparente y eficiente.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Homepage

