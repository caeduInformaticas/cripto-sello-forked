import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Alert, AlertDescription } from './ui/alert'
import PDFUploader from './PDFUploader'
import pinataService from '../services/pinataService'

const PropertyRegistrationFormSimple = ({ onRegistrationComplete }) => {
  const [formData, setFormData] = useState({
    carnetIdentidad: '',
    description: ''
  })
  
  const [documentInfo, setDocumentInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Limpiar error específico cuando se cumple el requisito mínimo
    if (errors[name]) {
      let shouldClearError = false
      
      if (name === 'carnetIdentidad') {
        // Limpiar error cuando tiene al menos 7 dígitos y son solo números
        shouldClearError = value.trim().length >= 7 && /^[0-9]+$/.test(value.trim())
      } else if (name === 'description') {
        // Limpiar error cuando tiene al menos 10 caracteres
        shouldClearError = value.trim().length >= 10
      }
      
      if (shouldClearError) {
        setErrors(prev => ({
          ...prev,
          [name]: null
        }))
      }
    }
  }

  const handlePDFUploaded = (result) => {
    setDocumentInfo(result)
  }

  const validateForm = () => {
    const newErrors = {}

    // Validar carnet de identidad
    if (!formData.carnetIdentidad.trim()) {
      newErrors.carnetIdentidad = 'Carnet de identidad es requerido'
    } else if (!/^[0-9]+$/.test(formData.carnetIdentidad.trim())) {
      newErrors.carnetIdentidad = 'Carnet de identidad debe contener solo números'
    } else if (formData.carnetIdentidad.trim().length < 7) {
      newErrors.carnetIdentidad = 'Carnet de identidad debe tener al menos 7 dígitos'
    }

    // Validar descripción
    if (!formData.description.trim()) {
      newErrors.description = 'Descripción es requerida'
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'La descripción debe tener al menos 10 caracteres'
    }

    // Validar documento
    if (!documentInfo) {
      newErrors.document = 'Documento PDF es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      console.log('Registrando propiedad...', formData, documentInfo)

      // Validar datos en el servicio
      pinataService.validatePropertyData(formData)

      // Crear metadatos de la propiedad con el documento
      const metadataResult = await pinataService.createPropertyMetadata(formData, documentInfo)

      console.log('Metadatos creados:', metadataResult)

      // Preparar datos para el contrato (mint)
      const contractData = {
        // Datos para la función mint del contrato
        tokenURI: metadataResult.url, // URI de IPFS para los metadatos
        carnetIdentidad: formData.carnetIdentidad,
        description: formData.description,
        
        // Información adicional
        metadataHash: metadataResult.ipfsHash,
        documentHash: documentInfo.ipfsHash,
        documentUrl: documentInfo.url,
        
        // Metadatos completos
        metadata: metadataResult.metadata,
        
        // Indicadores
        isDemoMode: pinataService.isDemoMode()
      }

      console.log('Datos preparados para el contrato:', contractData)

      // Notificar al componente padre
      if (onRegistrationComplete) {
        onRegistrationComplete(contractData)
      }

      // Mostrar éxito
      alert(
        pinataService.isDemoMode() 
          ? '✅ Propiedad registrada en modo demo exitosamente'
          : '✅ Propiedad registrada exitosamente. Los datos están listos para el mint del contrato.'
      )

    } catch (error) {
      console.error('Error al registrar propiedad:', error)
      alert(`Error al registrar propiedad: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = () => {
    // Verificar que los campos requeridos tengan contenido
    const hasRequiredFields = formData.carnetIdentidad.trim() && 
                              formData.description.trim() && 
                              documentInfo

    // Solo considerar errores críticos que impiden el envío
    const hasCriticalErrors = Object.keys(errors).some(key => {
      const error = errors[key]
      return error && (
        // Errores de formato que impiden el envío
        error.includes('contener solo números') ||
        error.includes('al menos 7 dígitos') ||
        error.includes('al menos 10 caracteres') ||
        error.includes('requerido')
      )
    })

    return hasRequiredFields && !hasCriticalErrors
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Registro de Propiedad</CardTitle>
          <CardDescription>
            Completa los datos para registrar una nueva propiedad en CriptoSello
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Carnet de Identidad */}
            <div className="space-y-2">
              <Label htmlFor="carnetIdentidad">
                Carnet de Identidad *
              </Label>
              <Input
                id="carnetIdentidad"
                name="carnetIdentidad"
                type="text"
                placeholder="Ej: 12345678"
                value={formData.carnetIdentidad}
                onChange={handleInputChange}
                className={errors.carnetIdentidad ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.carnetIdentidad && (
                <p className="text-sm text-red-600">{errors.carnetIdentidad}</p>
              )}
              <p className="text-xs text-gray-500">
                Ingresa el número de carnet de identidad del propietario
              </p>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Descripción de la Propiedad *
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe la propiedad: ubicación, características, etc."
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className={errors.description ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description}</p>
              )}
              <p className="text-xs text-gray-500">
                Proporciona una descripción detallada de la propiedad (mínimo 10 caracteres)
              </p>
            </div>

            {/* Subida de Documento */}
            <div className="space-y-2">
              <Label>
                Documento de Propiedad *
              </Label>
              <PDFUploader onPDFUploaded={handlePDFUploaded} />
              {errors.document && (
                <p className="text-sm text-red-600">{errors.document}</p>
              )}
              <p className="text-xs text-gray-500">
                Sube el documento oficial de la propiedad en formato PDF
              </p>
            </div>

            {/* Información del estado */}
            {pinataService.isDemoMode() && (
              <Alert>
                <AlertDescription>
                  <strong>Modo Demo:</strong> Los datos se procesarán localmente. 
                  Para usar IPFS real, configura tus credenciales de Pinata.
                </AlertDescription>
              </Alert>
            )}

            {/* Botón de envío */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !isFormValid()}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Registrando...</span>
                </div>
              ) : (
                'Registrar Propiedad'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Información sobre el proceso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Proceso de Registro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold">1</span>
            </div>
            <div>
              <p className="font-medium">Mint del Token</p>
              <p className="text-sm text-gray-600">Se crea el NFT con estado "EN_NOTARY"</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold">2</span>
            </div>
            <div>
              <p className="font-medium text-gray-600">Validación de Notaría</p>
              <p className="text-sm text-gray-500">La notaría valida los documentos</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold">3</span>
            </div>
            <div>
              <p className="font-medium text-gray-600">Registro Oficial</p>
              <p className="text-sm text-gray-500">DDRR registra oficialmente la propiedad</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PropertyRegistrationFormSimple
