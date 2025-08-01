from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.propiedad import Propiedad

consulta_bp = Blueprint('consulta', __name__)

@consulta_bp.route('/consulta/direccion/<path:direccion>', methods=['GET'])
def buscar_por_direccion(direccion):
    try:
        # Solo mostrar propiedades registradas (públicas)
        propiedades = Propiedad.query.filter(
            Propiedad.estado == 'REGISTRADO',
            Propiedad.direccion.ilike(f'%{direccion}%')
        ).all()
        
        return jsonify({
            'propiedades': [prop.to_dict() for prop in propiedades],
            'total': len(propiedades)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@consulta_bp.route('/consulta/folio/<folio>', methods=['GET'])
def buscar_por_folio(folio):
    try:
        # Solo mostrar propiedades registradas (públicas)
        propiedades = Propiedad.query.filter(
            Propiedad.estado == 'REGISTRADO',
            Propiedad.folio_real.ilike(f'%{folio}%')
        ).all()
        
        return jsonify({
            'propiedades': [prop.to_dict() for prop in propiedades],
            'total': len(propiedades)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@consulta_bp.route('/consulta/estadisticas', methods=['GET'])
def get_estadisticas():
    try:
        total_propiedades = Propiedad.query.count()
        propiedades_registradas = Propiedad.query.filter_by(estado='REGISTRADO').count()
        propiedades_en_proceso = total_propiedades - propiedades_registradas
        
        propiedades_por_estado = {
            'EN_NOTARIA': Propiedad.query.filter_by(estado='EN_NOTARIA').count(),
            'VALIDADO': Propiedad.query.filter_by(estado='VALIDADO').count(),
            'REGISTRADO': propiedades_registradas,
            'RECHAZADO': Propiedad.query.filter_by(estado='RECHAZADO').count()
        }
        
        return jsonify({
            'total': total_propiedades,
            'registradas': propiedades_registradas,
            'enProceso': propiedades_en_proceso,
            'porEstado': propiedades_por_estado
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

