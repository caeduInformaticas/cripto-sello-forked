import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAppContext } from '../App'
import apiService from '../services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, ArrowLeft } from 'lucide-react'

const AuthPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setUser, apiService: api } = useAppContext()
  
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    ci: '',
    rol: searchParams.get('role') || 'PROPIETARIO'
  })

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleRoleChange = (value) => {
    setFormData({
      ...formData,
      rol: value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      let response
      
      if (isLogin) {
        response = await api.login(formData.email, formData.password)
      } else {
        response = await api.register(formData)
      }
      
      setUser(response.user)
      
      // Redirigir según el rol
      switch (response.user.rol) {
        case 'PROPIETARIO':
          navigate('/propietario')
          break
        case 'NOTARIA':
          navigate('/notaria')
          break
        case 'DDRR':
          navigate('/ddrr')
          break
        default:
          navigate('/')
      }
    } catch (error) {
      console.error('Error en autenticación:', error)
      alert(error.message || 'Error en la autenticación')
    }
  }

  const getRoleDisplayName = (role) => {
    const roles = {
      'PROPIETARIO': 'Propietario',
      'NOTARIA': 'Notaría',
      'DDRR': 'DDRR',
      'OBSERVADOR': 'Observador'
    }
    return roles[role] || role
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="h-4 w-4" />
            <span>Volver al inicio</span>
          </Link>
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Building2 className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">CriptoSello</h1>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? `Accede como ${getRoleDisplayName(formData.rol)}`
                : `Regístrate como ${getRoleDisplayName(formData.rol)}`
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Rol */}
              <div className="space-y-2">
                <Label htmlFor="rol">Rol</Label>
                <Select value={formData.rol} onValueChange={handleRoleChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROPIETARIO">Propietario</SelectItem>
                    <SelectItem value="NOTARIA">Notaría</SelectItem>
                    <SelectItem value="DDRR">DDRR</SelectItem>
                    <SelectItem value="OBSERVADOR">Observador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Campos adicionales para registro */}
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre Completo</Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      type="text"
                      placeholder="Juan Pérez"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ci">Cédula de Identidad</Label>
                    <Input
                      id="ci"
                      name="ci"
                      type="text"
                      placeholder="12345678"
                      value={formData.ci}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </>
              )}

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                {isLogin 
                  ? '¿No tienes cuenta? Regístrate aquí'
                  : '¿Ya tienes cuenta? Inicia sesión aquí'
                }
              </button>
            </div>

            {/* Demo credentials */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 font-medium mb-2">Credenciales de demo:</p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Email: demo@criptosello.com</p>
                <p>Contraseña: demo123</p>
                <p className="text-blue-600">Funciona con cualquier rol seleccionado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AuthPage

