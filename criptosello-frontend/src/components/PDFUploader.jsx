import React, { useState } from 'react'
import pinataService from '../services/pinataService'

const PDFUploader = ({ onPDFUploaded }) => {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)

  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) return

    const file = files[0]

    // Validar que sea PDF
    if (file.type !== 'application/pdf') {
      alert('Solo se permiten archivos PDF')
      return
    }

    setUploading(true)
    setUploadProgress('Preparando archivo...')

    try {
      setUploadProgress('Subiendo PDF a IPFS...')
      const result = await pinataService.uploadPDF(file)

      // Mostrar mensaje apropiado según el modo
      const isDemoMode = pinataService.isDemoMode()
      setUploadProgress(isDemoMode ? '¡Simulación completada!' : '¡Subida completada!')
      
      setUploadedFile({
        name: file.name,
        size: file.size,
        result: result
      })

      // Notificar al componente padre
      if (onPDFUploaded) {
        onPDFUploaded(result)
      }

      // Limpiar progreso después de 2 segundos
      setTimeout(() => setUploadProgress(null), 2000)

    } catch (error) {
      console.error('Error al subir PDF:', error)
      alert(`Error al subir PDF: ${error.message}`)
      setUploadProgress(null)
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type === 'application/pdf'
    )
    
    if (files.length > 0) {
      handleFileSelect(files)
    } else {
      alert('Solo se permiten archivos PDF')
    }
  }

  const handleInputChange = (e) => {
    handleFileSelect(e.target.files)
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    if (onPDFUploaded) {
      onPDFUploaded(null)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full space-y-4">
      {/* Área de subida */}
      {!uploadedFile && (
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragActive ? 'border-red-500 bg-red-50' : 'border-gray-300'}
            ${uploading ? 'opacity-50 pointer-events-none' : 'hover:border-red-400 hover:bg-gray-50'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleInputChange}
            disabled={uploading}
            className="hidden"
            id="pdf-upload"
          />
          
          <label htmlFor="pdf-upload" className="cursor-pointer">
            <div className="space-y-4">
              {uploading ? (
                <div className="space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                  <p className="text-red-600 font-medium">{uploadProgress}</p>
                </div>
              ) : (
                <>
                  <div className="mx-auto w-12 h-12 text-gray-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-700">
                      Sube el documento de la propiedad
                    </p>
                    <p className="text-sm text-gray-500">
                      Arrastra y suelta o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Solo archivos PDF hasta 100MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </label>
        </div>
      )}

      {/* Archivo subido */}
      {uploadedFile && (
        <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(uploadedFile.size)}</p>
                {uploadedFile.result.demo && (
                  <p className="text-xs text-blue-600">📁 Modo demo - archivo no subido a IPFS real</p>
                )}
                {!uploadedFile.result.demo && (
                  <p className="text-xs text-green-600">✅ Subido a IPFS: {uploadedFile.result.ipfsHash.slice(0, 10)}...</p>
                )}
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Eliminar archivo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Estado de Pinata */}
      {pinataService.isDemoMode() && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            🎯 <strong>Modo Demo:</strong> Los archivos se procesan localmente pero no se suben a IPFS real.
            <br />
            Para usar IPFS real, configura tus credenciales de Pinata en el archivo .env
          </p>
        </div>
      )}

      {pinataService.isConfiguredCorrectly() && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700">
            ✅ Pinata configurado - Los archivos se subirán a IPFS real
          </p>
        </div>
      )}
    </div>
  )
}

export default PDFUploader
