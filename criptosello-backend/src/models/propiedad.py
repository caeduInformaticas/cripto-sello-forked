from src.models.user import db
from datetime import datetime
import json

class Propiedad(db.Model):
    __tablename__ = 'propiedades'
    
    id = db.Column(db.String(50), primary_key=True)
    direccion = db.Column(db.String(200), nullable=False)
    folio_real = db.Column(db.String(50), nullable=False, unique=True)
    propietario_id = db.Column(db.String(50), nullable=False)
    propietario_nombre = db.Column(db.String(100), nullable=False)
    estado = db.Column(db.String(20), nullable=False, default='EN_NOTARIA')
    descripcion = db.Column(db.Text)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_actualizacion = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    fecha_registro = db.Column(db.DateTime)
    
    # Relaciones
    documentos = db.relationship('Documento', backref='propiedad', lazy=True, cascade='all, delete-orphan')
    historial = db.relationship('HistorialEstado', backref='propiedad', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'direccion': self.direccion,
            'folioReal': self.folio_real,
            'propietarioId': self.propietario_id,
            'propietarioNombre': self.propietario_nombre,
            'estado': self.estado,
            'descripcion': self.descripcion,
            'fechaCreacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None,
            'fechaActualizacion': self.fecha_actualizacion.isoformat() if self.fecha_actualizacion else None,
            'fechaRegistro': self.fecha_registro.isoformat() if self.fecha_registro else None,
            'documentos': [doc.to_dict() for doc in self.documentos],
            'historial': [hist.to_dict() for hist in self.historial]
        }

class Documento(db.Model):
    __tablename__ = 'documentos'
    
    id = db.Column(db.String(50), primary_key=True)
    nombre = db.Column(db.String(200), nullable=False)
    tipo = db.Column(db.String(20), nullable=False)  # CI, PLANO, FOLIO_REAL, OTRO
    url = db.Column(db.String(500))
    fecha_subida = db.Column(db.DateTime, default=datetime.utcnow)
    propiedad_id = db.Column(db.String(50), db.ForeignKey('propiedades.id'), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'tipo': self.tipo,
            'url': self.url,
            'fechaSubida': self.fecha_subida.isoformat() if self.fecha_subida else None
        }

class HistorialEstado(db.Model):
    __tablename__ = 'historial_estados'
    
    id = db.Column(db.String(50), primary_key=True)
    estado_anterior = db.Column(db.String(20))
    estado_nuevo = db.Column(db.String(20), nullable=False)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)
    usuario_id = db.Column(db.String(50), nullable=False)
    observaciones = db.Column(db.Text)
    propiedad_id = db.Column(db.String(50), db.ForeignKey('propiedades.id'), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'estadoAnterior': self.estado_anterior,
            'estadoNuevo': self.estado_nuevo,
            'fecha': self.fecha.isoformat() if self.fecha else None,
            'usuarioId': self.usuario_id,
            'observaciones': self.observaciones
        }

