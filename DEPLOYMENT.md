# Guía de Despliegue - CriptoSello

## Instrucciones de Instalación y Ejecución

### Prerrequisitos

- Node.js v18 o superior
- Python 3.8 o superior
- Git

### 1. Configuración del Entorno

```bash
# Clonar o extraer el proyecto
cd criptosello

# Instalar dependencias globales si es necesario
npm install -g hardhat
```

### 2. Configuración del Smart Contract

```bash
cd contracts

# Instalar dependencias
npm install

# Compilar contratos
npx hardhat compile

# Ejecutar tests (opcional)
npx hardhat test

# Iniciar nodo local de blockchain
npx hardhat node
```

**Importante**: Mantener el nodo corriendo en una terminal separada.

### 3. Despliegue del Smart Contract

En una nueva terminal:

```bash
cd contracts

# Desplegar en red local
npx hardhat run scripts/deploy.js --network localhost
```

Guardar la dirección del contrato desplegado que aparece en la consola.

### 4. Configuración del Frontend

```bash
cd ../criptosello-frontend

# Instalar dependencias
npm install

# Actualizar dirección del contrato en src/utils/blockchain.js
# Reemplazar CONTRACT_ADDRESS con la dirección obtenida en el paso anterior

# Iniciar servidor de desarrollo
npm run dev
```

### 5. Configuración del Backend (Opcional)

```bash
cd ../criptosello-backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar servidor
python src/main.py
```

### 6. Acceso a la Aplicación

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Nodo Blockchain**: http://localhost:8545

## Configuración de MetaMask (Opcional)

Para usar MetaMask en lugar del nodo local:

1. Agregar red personalizada:
   - **Nombre**: Hardhat Local
   - **RPC URL**: http://localhost:8545
   - **Chain ID**: 31337
   - **Símbolo**: ETH

2. Importar cuenta de prueba:
   - Usar una de las claves privadas proporcionadas por Hardhat

## Estructura de Cuentas

El nodo local proporciona 20 cuentas con 10,000 ETH cada una:

```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

# ... más cuentas disponibles
```

## Roles del Sistema

### Owner (Propietario del Contrato)
- **Cuenta**: Account #0
- **Funciones**: Agregar/remover notarios, configurar DDRR

### Notarios
- **Cuenta sugerida**: Account #1
- **Funciones**: Crear y validar propiedades

### DDRR
- **Cuenta sugerida**: Account #2
- **Funciones**: Registrar propiedades validadas

### Usuarios
- **Cuentas**: Account #3 en adelante
- **Funciones**: Propietarios de propiedades

## Configuración de Roles

Después del despliegue, configurar los roles:

```bash
# En la consola de Hardhat
npx hardhat console --network localhost

# Agregar notario
const contract = await ethers.getContractAt("CriptoSello", "DIRECCION_DEL_CONTRATO");
await contract.addNotary("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
```

## Flujo de Prueba

### 1. Como Notario
1. Ir a http://localhost:5173
2. Hacer clic en "Notarías"
3. Conectar con Account #1
4. Crear nueva propiedad:
   - **Dirección del Propietario**: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
   - **ID del Token**: 1
   - **Información del Propietario**: Juan Pérez - CI: 12345678
   - **Detalles**: Casa de 2 pisos, 150m², Zona Sur, La Paz
   - **Hash de Documentos**: QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

### 2. Como DDRR
1. Cambiar a Account #2
2. Ir al panel DDRR
3. Registrar la propiedad validada

### 3. Consulta Pública
1. Ir a "Consulta Pública"
2. Buscar por ID de token: 1
3. Ver información de la propiedad

## Solución de Problemas

### Error: "Property already exists"
- Usar un ID de token diferente

### Error: "Caller is not a notary"
- Verificar que la cuenta esté agregada como notario
- Usar la cuenta correcta

### Error de conexión a blockchain
- Verificar que el nodo Hardhat esté corriendo
- Verificar la dirección del contrato en el frontend

### Frontend no carga
- Verificar que todas las dependencias estén instaladas
- Revisar la consola del navegador para errores

## Comandos Útiles

```bash
# Limpiar y recompilar contratos
npx hardhat clean && npx hardhat compile

# Ver cuentas disponibles
npx hardhat accounts

# Verificar balance de cuenta
npx hardhat console --network localhost
# En la consola: await ethers.provider.getBalance("DIRECCION")

# Reiniciar nodo (limpia estado)
npx hardhat node --reset
```

## Notas de Desarrollo

- El nodo local reinicia el estado cada vez que se detiene
- Las transacciones son instantáneas en la red local
- Los logs de eventos se pueden ver en la consola del nodo
- Para producción, cambiar a una red de prueba como Sepolia

## Archivos de Configuración Importantes

- `contracts/hardhat.config.js`: Configuración de red
- `criptosello-frontend/src/utils/blockchain.js`: Configuración del frontend
- `contracts/scripts/deploy.js`: Script de despliegue

## Próximos Pasos

1. Integrar con IPFS para almacenamiento de documentos
2. Implementar sistema de notificaciones
3. Agregar más validaciones de seguridad
4. Crear interfaz móvil
5. Integrar con sistemas gubernamentales existentes

