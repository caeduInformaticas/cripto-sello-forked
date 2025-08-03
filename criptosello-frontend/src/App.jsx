import { useState, createContext, useContext } from 'react'
import './App.css'
import BlockchainPanel from './components/BlockchainPanel'
import PropertyRegistrationFormSimple from './components/PropertyRegistrationFormSimple'
import PinataSetup from './components/PinataSetup'

// Context para el estado global
const AppContext = createContext()

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext debe ser usado dentro de AppProvider')
  }
  return context
}

function App() {
  const [currentView, setCurrentView] = useState('home')
  const [user, setUser] = useState(null)

  const contextValue = {
    user,
    setUser,
    currentView,
    setCurrentView
  }

  const renderView = () => {
    switch (currentView) {
      case 'consulta':
        return <ConsultaPublica />
      case 'notaria':
        return <NotariaPanel />
      case 'ddrr':
        return <DDRRPanel />
      default:
        return <Homepage />
    }
  }

  return (
    <AppContext.Provider value={contextValue}>
      <div className="min-h-screen bg-slate-50">
        {renderView()}
      </div>
    </AppContext.Provider>
  )
}

// Componente Homepage
const Homepage = () => {
  const { setCurrentView } = useAppContext()

  return (
    <>
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-blue-600 rounded"></div>
              <h1 className="text-2xl font-bold text-gray-900">CriptoSello</h1>
            </div>
            <button 
              onClick={() => setCurrentView('consulta')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Consulta Pública
            </button>
          </div>
        </div>
      </header>

      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Modernizando el Registro de Propiedades
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            CriptoSello es una plataforma digital que simplifica y agiliza el proceso de 
            registro y validación de propiedades usando blockchain.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white p-6 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                 onClick={() => setCurrentView('home')}>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Propietarios</h3>
              <p className="text-gray-600">Registra y da seguimiento a tus propiedades</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                 onClick={() => setCurrentView('notaria')}>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-xl">🛡️</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Notarías</h3>
              <p className="text-gray-600">Valida documentos y autoriza registros</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                 onClick={() => setCurrentView('ddrr')}>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 text-xl">🏢</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">DDRR</h3>
              <p className="text-gray-600">Registra oficialmente las propiedades</p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

// Componente ConsultaPublica
const ConsultaPublica = () => {
  const { setCurrentView } = useAppContext()

  return (
    <>
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-blue-600 rounded"></div>
              <h1 className="text-2xl font-bold text-gray-900">CriptoSello</h1>
              <span className="text-sm text-gray-500">- Consulta Pública</span>
            </div>
            <button 
              onClick={() => setCurrentView('home')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </header>

      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Consulta Pública de Propiedades
            </h2>
            <p className="text-lg text-gray-600">
              Verifica el estado y la información de cualquier propiedad registrada en la blockchain.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <BlockchainPanel userRole="OBSERVADOR" />
          </div>
        </div>
      </main>
    </>
  )
}

// Componente NotariaPanel
const NotariaPanel = () => {
  const { setCurrentView } = useAppContext()

  return (
    <>
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-green-600 rounded"></div>
              <h1 className="text-2xl font-bold text-gray-900">CriptoSello</h1>
              <span className="text-sm text-gray-500">- Panel Notaría</span>
            </div>
            <button 
              onClick={() => setCurrentView('home')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </header>

      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Panel de Notaría
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Registra nuevas propiedades y gestiona el proceso completo de certificación en la blockchain.
            </p>
            
            {/* Información del proceso */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-green-800">
                Proceso de Registro con Pinata Cloud
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-600 font-bold text-lg">1</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Crear Metadatos</h4>
                  <p className="text-sm text-gray-600">
                    Sube documentos e imágenes a IPFS y crea metadatos completos de la propiedad
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold text-lg">2</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Mintear NFT</h4>
                  <p className="text-sm text-gray-600">
                    Crear el NFT de la propiedad con estado "EN_NOTARIA" usando el contrato
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-purple-600 font-bold text-lg">3</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Validar y Registrar</h4>
                  <p className="text-sm text-gray-600">
                    Revisar documentación, validar y enviar a DDRR para registro oficial
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <PropertyRegistrationFormSimple 
              onRegistrationComplete={(contractData) => {
                console.log('Registro desde homepage:', contractData)
                alert(`Propiedad registrada desde homepage:\nURI: ${contractData.tokenURI}\nCI: ${contractData.carnetIdentidad}`)
              }}
            />
          </div>
        </div>
      </main>
    </>
  )
}

// Componente DDRRPanel
const DDRRPanel = () => {
  const { setCurrentView } = useAppContext()

  return (
    <>
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-purple-600 rounded"></div>
              <h1 className="text-2xl font-bold text-gray-900">CriptoSello</h1>
              <span className="text-sm text-gray-500">- Panel DDRR</span>
            </div>
            <button 
              onClick={() => setCurrentView('home')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </header>

      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Panel de Derechos Reales (DDRR)
            </h2>
            <p className="text-lg text-gray-600">
              Registra oficialmente las propiedades validadas en la blockchain.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <BlockchainPanel userRole="DDRR" />
          </div>
        </div>
      </main>
    </>
  )
}

export default App

