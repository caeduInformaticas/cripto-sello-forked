const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000'

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body)
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Auth endpoints
  async login(email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
  }

  async register(userData) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: userData,
    })
  }

  async getCurrentUser(userId) {
    return this.request('/api/auth/me', {
      headers: { 'X-User-Id': userId },
    })
  }

  // Propiedades endpoints
  async getPropiedades(filters = {}) {
    const params = new URLSearchParams(filters)
    return this.request(`/api/propiedades?${params}`)
  }

  async createPropiedad(propiedadData) {
    return this.request('/api/propiedades', {
      method: 'POST',
      body: propiedadData,
    })
  }

  async getPropiedad(id) {
    return this.request(`/api/propiedades/${id}`)
  }

  async updateEstadoPropiedad(id, estado, usuarioId, observaciones = '') {
    return this.request(`/api/propiedades/${id}/estado`, {
      method: 'PUT',
      body: { estado, usuarioId, observaciones },
    })
  }

  async addDocumento(propiedadId, documentoData) {
    return this.request(`/api/propiedades/${propiedadId}/documentos`, {
      method: 'POST',
      body: documentoData,
    })
  }

  // Consulta pública endpoints
  async buscarPorDireccion(direccion) {
    return this.request(`/api/consulta/direccion/${encodeURIComponent(direccion)}`)
  }

  async buscarPorFolio(folio) {
    return this.request(`/api/consulta/folio/${encodeURIComponent(folio)}`)
  }

  async getEstadisticas() {
    return this.request('/api/consulta/estadisticas')
  }
}

export default new ApiService()

