from flask import Blueprint, request, jsonify
from src.models.user import db, User
import uuid
import hashlib

auth_bp = Blueprint('auth', __name__)

def hash_password(password):
    """Hash a password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email y contraseña son requeridos'}), 400
        
        # Buscar usuario por email
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        
        # Verificar contraseña
        hashed_password = hash_password(password)
        if user.password != hashed_password:
            return jsonify({'error': 'Contraseña incorrecta'}), 401
        
        return jsonify({
            'message': 'Login exitoso',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validar campos requeridos
        required_fields = ['email', 'password', 'nombre', 'rol']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} es requerido'}), 400
        
        # Verificar si el usuario ya existe
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'error': 'El usuario ya existe'}), 409
        
        # Crear nuevo usuario
        user = User(
            id=str(uuid.uuid4()),
            nombre=data['nombre'],
            email=data['email'],
            password=hash_password(data['password']),
            rol=data['rol'],
            ci=data.get('ci'),
            telefono=data.get('telefono'),
            direccion=data.get('direccion')
        )
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'Usuario registrado exitosamente',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    # En una implementación real, esto verificaría el token JWT
    # Por ahora, retornamos un usuario demo
    user_id = request.headers.get('X-User-Id')
    
    if not user_id:
        return jsonify({'error': 'No autorizado'}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404
    
    return jsonify({'user': user.to_dict()}), 200

