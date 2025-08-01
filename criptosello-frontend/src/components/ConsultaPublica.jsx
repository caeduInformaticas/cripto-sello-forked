import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, ArrowLeft } from 'lucide-react'
import BlockchainPanel from './BlockchainPanel'

const ConsultaPublica = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">CriptoSello</h1>
              <span className="text-sm text-gray-500">- Consulta Pública</span>
            </div>
            <Link to="/">
              <Button variant="outline" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Volver al Inicio</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Consulta Pública de Propiedades
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Verifica el estado y la información de cualquier propiedad registrada 
              en la blockchain de CriptoSello. La información es pública y transparente.
            </p>
          </div>

          {/* Panel de Blockchain para consultas */}
          <Card>
            <CardHeader>
              <CardTitle>Consulta de Propiedades en Blockchain</CardTitle>
              <CardDescription>
                Busca propiedades directamente en la blockchain usando su ID de token
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BlockchainPanel userRole="OBSERVADOR" />
            </CardContent>
          </Card>

          {/* Información adicional */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">¿Cómo funciona?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <p>
                  • Cada propiedad tiene un ID único (Token ID) en la blockchain
                </p>
                <p>
                  • Los estados posibles son: En Notaría, Validado, Registrado
                </p>
                <p>
                  • La información es inmutable y verificable públicamente
                </p>
                <p>
                  • No se requiere registro para consultar propiedades
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estados de Propiedad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span><strong>En Notaría:</strong> Documentos en proceso de validación</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span><strong>Validado:</strong> Documentos validados por notaría</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span><strong>Registrado:</strong> Propiedad oficialmente registrada</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ConsultaPublica

