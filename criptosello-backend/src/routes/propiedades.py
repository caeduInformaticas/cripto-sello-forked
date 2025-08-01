from flask import Blueprint, request, jsonify
from src.models.user import db, User
from src.models.propiedad import Propiedad, Documento, HistorialEstado
import uuid
from datetime import datetime

propiedades_bp = Blueprint('propiedades', __name__)

@propiedades_bp.route('/propiedades', methods=['GET'])
def get_propiedades():
    try:
        # Obtener parámetros de filtro
        rol = request.args.get('rol')
        user_id = request.args.get('user_id')
        estado = request.args.get('estado')
        
        query = Propiedad.query
        
        # Filtrar según el rol
        if rol == 'PROPIETARIO' and user_id:
            query = query.filter_by(propietario_id=user_id)
        elif rol == 'NOTARIA':
            query = query.filter_by(estado='EN_NOTARIA')
        elif rol == 'DDRR':
            query = query.filter_by(estado='VALIDADO')
        
        # Filtro adicional por estado si se especifica
        if estado:
            query = query.filter_by(estado=estado)
        
        propiedades = query.all()
        
        return jsonify({
            'propiedades': [prop.to_dict() for prop in propiedades]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@propiedades_bp.route('/propiedades', methods=['POST'])
def create_propiedad():
    try:
        data = request.get_json()
        
        # Validar campos requeridos
        required_fields = ['direccion', 'folioReal', 'propietarioId', 'propietarioNombre']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} es requerido'}), 400
        
        # Verificar que el Folio Real no exista
        existing_prop = Propiedad.query.filter_by(folio_real=data['folioReal']).first()
        if existing_prop:
            return jsonify({'error': 'El Folio Real ya existe'}), 409
        
        # Crear nueva propiedad
        propiedad_id = str(uuid.uuid4())
        propiedad = Propiedad(
            id=propiedad_id,
            direccion=data['direccion'],
            folio_real=data['folioReal'],
            propietario_id=data['propietarioId'],
            propietario_nombre=data['propietarioNombre'],
            estado='EN_NOTARIA',
            descripcion=data.get('descripcion')
        )
        
        db.session.add(propiedad)
        
        # Crear documentos si existen
        documentos_data = data.get('documentos', [])
        for doc_data in documentos_data:
            documento = Documento(
                id=str(uuid.uuid4()),
                nombre=doc_data['nombre'],
                tipo=doc_data['tipo'],
                url=doc_data.get('url', ''),
                propiedad_id=propiedad_id
            )
            db.session.add(documento)
        
        # Crear entrada en historial
        historial = HistorialEstado(
            id=str(uuid.uuid4()),
            estado_anterior=None,
            estado_nuevo='EN_NOTARIA',
            usuario_id=data['propietarioId'],
            observaciones='Propiedad registrada por el propietario',
            propiedad_id=propiedad_id
        )
        db.session.add(historial)
        
        db.session.commit()
        
        # Recargar la propiedad con todas las relaciones
        propiedad = Propiedad.query.get(propiedad_id)
        
        return jsonify({
            'message': 'Propiedad creada exitosamente',
            'propiedad': propiedad.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@propiedades_bp.route('/propiedades/<propiedad_id>', methods=['GET'])
def get_propiedad(propiedad_id):
    try:
        propiedad = Propiedad.query.get(propiedad_id)
        
        if not propiedad:
            return jsonify({'error': 'Propiedad no encontrada'}), 404
        
        return jsonify({'propiedad': propiedad.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@propiedades_bp.route('/propiedades/<propiedad_id>/estado', methods=['PUT'])
def update_estado_propiedad(propiedad_id):
    try:
        data = request.get_json()
        
        # Validar campos requeridos
        if not data.get('estado') or not data.get('usuarioId'):
            return jsonify({'error': 'Estado y usuarioId son requeridos'}), 400
        
        propiedad = Propiedad.query.get(propiedad_id)
        if not propiedad:
            return jsonify({'error': 'Propiedad no encontrada'}), 404
        
        estado_anterior = propiedad.estado
        nuevo_estado = data['estado']
        
        # Validar transiciones de estado
        transiciones_validas = {
            'EN_NOTARIA': ['VALIDADO', 'RECHAZADO'],
            'VALIDADO': ['REGISTRADO', 'RECHAZADO'],
            'RECHAZADO': ['EN_NOTARIA', 'VALIDADO']
        }
        
        if nuevo_estado not in transiciones_validas.get(estado_anterior, []):
            return jsonify({'error': f'Transición de {estado_anterior} a {nuevo_estado} no válida'}), 400
        
        # Actualizar estado
        propiedad.estado = nuevo_estado
        propiedad.fecha_actualizacion = datetime.utcnow()
        
        # Si se registra oficialmente, establecer fecha de registro
        if nuevo_estado == 'REGISTRADO':
            propiedad.fecha_registro = datetime.utcnow()
        
        # Crear entrada en historial
        historial = HistorialEstado(
            id=str(uuid.uuid4()),
            estado_anterior=estado_anterior,
            estado_nuevo=nuevo_estado,
            usuario_id=data['usuarioId'],
            observaciones=data.get('observaciones', ''),
            propiedad_id=propiedad_id
        )
        db.session.add(historial)
        
        db.session.commit()
        
        # Recargar la propiedad con todas las relaciones
        propiedad = Propiedad.query.get(propiedad_id)
        
        return jsonify({
            'message': 'Estado actualizado exitosamente',
            'propiedad': propiedad.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@propiedades_bp.route('/propiedades/<propiedad_id>/documentos', methods=['POST'])
def add_documento(propiedad_id):
    try:
        data = request.get_json()
        
        # Validar campos requeridos
        required_fields = ['nombre', 'tipo']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} es requerido'}), 400
        
        propiedad = Propiedad.query.get(propiedad_id)
        if not propiedad:
            return jsonify({'error': 'Propiedad no encontrada'}), 404
        
        # Crear documento
        documento = Documento(
            id=str(uuid.uuid4()),
            nombre=data['nombre'],
            tipo=data['tipo'],
            url=data.get('url', ''),
            propiedad_id=propiedad_id
        )
        
        db.session.add(documento)
        db.session.commit()
        
        return jsonify({
            'message': 'Documento agregado exitosamente',
            'documento': documento.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

