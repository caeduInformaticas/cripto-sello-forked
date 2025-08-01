# CriptoSello - Registro de Propiedades en Blockchain

## Descripción

CriptoSello es una plataforma digital que moderniza el proceso de registro y validación de propiedades utilizando tecnología blockchain. El sistema conecta propietarios, notarías y Derechos Reales (DDRR) en un flujo transparente y eficiente.

## Arquitectura del Sistema

### Componentes Principales

1. **Smart Contract (Solidity)**: Contrato inteligente que gestiona el registro de propiedades como NFTs
2. **Frontend (React)**: Interfaz web para interactuar con la blockchain
3. **Backend (Flask)**: API REST para gestión de datos complementarios
4. **Blockchain Local**: Nodo Hardhat para desarrollo y testing

### Flujo del Proceso

1. **Propietario**: Sube documentos y solicita registro
2. **Notaría**: Valida documentos y crea la propiedad en blockchain
3. **DDRR**: Registra oficialmente la propiedad validada

## Tecnologías Utilizadas

- **Blockchain**: Ethereum, Solidity, Hardhat
- **Frontend**: React, Vite, TailwindCSS, Ethers.js
- **Backend**: Flask, Python, SQLite
- **Herramientas**: Node.js, npm, Git

## Estructura del Proyecto

```
criptosello/
├── contracts/                 # Smart contracts y configuración Hardhat
│   ├── contracts/
│   │   └── CriptoSello.sol   # Contrato principal
│   ├── scripts/
│   │   └── deploy.js         # Script de despliegue
│   └── hardhat.config.js     # Configuración Hardhat
├── criptosello-frontend/     # Aplicación React
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── utils/           # Utilidades blockchain
│   │   └── App.jsx          # Componente principal
│   └── package.json
├── criptosello-backend/      # API Flask
│   ├── src/
│   │   └── main.py          # Servidor principal
│   └── requirements.txt
└── README.md
```

## Instalación y Configuración

### Prerrequisitos

- Node.js (v18+)
- Python (v3.8+)
- Git

### 1. Configuración del Smart Contract

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat node  # En terminal separado
npx hardhat run scripts/deploy.js --network localhost
```

### 2. Configuración del Frontend

```bash
cd criptosello-frontend
npm install
npm run dev
```

### 3. Configuración del Backend

```bash
cd criptosello-backend
pip install -r requirements.txt
python src/main.py
```

## Uso del Sistema

### Para Notarías

1. Acceder al panel de notaría
2. Conectar wallet o usar nodo local
3. Crear nueva propiedad con datos del propietario
4. Validar propiedades existentes

### Para DDRR

1. Acceder al panel DDRR
2. Conectar wallet o usar nodo local
3. Registrar propiedades validadas por notarías

### Para Consulta Pública

1. Acceder a consulta pública
2. Buscar propiedad por ID de token
3. Ver estado y detalles de la propiedad

## Smart Contract - CriptoSello

### Funciones Principales

- `createProperty()`: Crea nueva propiedad (solo notarios)
- `validateProperty()`: Valida propiedad (solo notarios)
- `registerProperty()`: Registra propiedad (solo DDRR)
- `getProperty()`: Consulta información de propiedad

### Estados de Propiedad

- **IN_NOTARY (0)**: En proceso de validación
- **VALIDATED (1)**: Validado por notaría
- **REGISTERED (2)**: Registrado oficialmente

## Configuración de Red

### Red Local (Desarrollo)

- RPC URL: `http://localhost:8545`
- Chain ID: `31337`
- Contrato: `0x5FbDB2315678afecb367f032d93F642f64180aa3`

### Cuentas de Prueba

El nodo local proporciona 20 cuentas con 10,000 ETH cada una para testing.

## Seguridad

- Control de acceso basado en roles (Owner, Notarios, DDRR)
- Validación de estados antes de transiciones
- Eventos para auditoría de cambios

## Testing

### Pruebas del Smart Contract

```bash
cd contracts
npx hardhat test
```

### Pruebas del Frontend

```bash
cd criptosello-frontend
npm test
```

## Despliegue

### Red de Prueba

1. Configurar red en `hardhat.config.js`
2. Obtener tokens de prueba
3. Desplegar contrato: `npx hardhat run scripts/deploy.js --network testnet`

### Producción

1. Configurar red principal
2. Verificar contrato en explorador
3. Actualizar direcciones en frontend

## Contribución

1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -am 'Agregar nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

## Contacto

Para preguntas o soporte, contactar al equipo de desarrollo.

## Roadmap

- [ ] Integración con IPFS para documentos
- [ ] Soporte para múltiples redes
- [ ] Interfaz móvil
- [ ] Sistema de notificaciones
- [ ] Integración con sistemas gubernamentales

## Notas de Desarrollo

### Buildathon ETH Bolivia 2025

Este proyecto fue desarrollado para la Buildathon ETH Bolivia 2025, enfocándose en:

- Modernización de procesos gubernamentales
- Transparencia en registros públicos
- Adopción de tecnología blockchain
- Mejora de la experiencia ciudadana

### Consideraciones Técnicas

- El sistema usa un nodo local para desarrollo
- La integración con MetaMask está disponible para producción
- Los datos se almacenan tanto en blockchain como en base de datos tradicional
- La interfaz es responsive y accesible

