import React, { useState } from 'react'
import PDFUploader from './PDFUploader'
import PropertyRegistrationFormSimple from './PropertyRegistrationFormSimple'
import PinataSetup from './PinataSetup'
import pinataService from '../services/pinataService'

const ExampleUsage = () => {
  const [uploadedDocuments, setUploadedDocuments] = useState([])

  const handlePDFUploaded = (result) => {
    console.log('PDF subido:', result)
    
    if (result) {
      setUploadedDocuments(prev => [...prev, result])
    }
  }

  const handleRegistrationComplete = (contractData) => {
    console.log('Registro completado:', contractData)
    alert(`Registro completado!
URI: ${contractData.tokenURI}
CI: ${contractData.carnetIdentidad}`)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Ejemplo de Uso - CriptoSello con Pinata</h1>
        <p className="text-gray-600 mb-6">
          Ejemplos de cómo usar los componentes de registro de propiedades con Pinata Cloud
        </p>
      </div>

      {/* Configuración de Pinata */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Configuración IPFS</h2>
        <PinataSetup />
      </div>

      {/* Subida de PDF */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Subida de Documentos PDF</h2>
        <PDFUploader onPDFUploaded={handlePDFUploaded} />
      </div>

      {/* Formulario de Registro */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">Registro de Propiedad</h2>
        <PropertyRegistrationFormSimple onRegistrationComplete={handleRegistrationComplete} />
      </div>

      {/* Documentos subidos */}
      {uploadedDocuments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">Documentos Subidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedDocuments.map((document, index) => (
              <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{document.name}</p>
                    <p className="text-sm text-gray-500">
                      {document.demo ? 'Modo Demo' : 'IPFS Real'}
                    </p>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">Hash:</span> {document.ipfsHash.slice(0, 20)}...
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Tamaño:</span> {Math.round(document.pinSize / 1024)} KB
                  </p>
                  <a 
                    href={document.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Ver documento →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado del servicio */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Estado del Servicio</h3>
        <p className="text-gray-600">
          Estado: {pinataService.isConfiguredCorrectly() ? '✅ Configurado' : '❌ Modo Demo'}
        </p>
        {pinataService.isDemoMode() && (
          <p className="text-sm text-yellow-600 mt-2">
            Para usar IPFS real, configura tus credenciales de Pinata en el archivo .env
          </p>
        )}
      </div>
    </div>
  )
}

export default ExampleUsage
