import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Registro() {
    const [nombre, setNombre] = useState('');
    const [apellidos, setApellidos] = useState('');
    const [correo, setCorreo] = useState('');
    const [telefono, setTelefono] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const validateForm = () => {
        if (!nombre || !apellidos || !correo || !telefono || !password) {
            setError('Por favor, complete todos los campos.');
            return false;
        }
        if (!/^\d{9}$/.test(telefono)) {
            setError('El número de teléfono debe tener exactamente 9 dígitos.');
            return false;
        }
        setError('');
        return true;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validateForm()) {
            return;
        }

        const userData = {
            nombre,
            apellidos,
            correo,
            telefono,
            password
        };

        try {
            const response = await axios.post('http://localhost:5000/register', userData);
            alert('Usuario registrado con éxito: ' + response.data.message);
            navigate('/');
        } catch (error) {
            console.error('Error al registrar el usuario', error);
            alert('Error al registrar el usuario');
        }
    };

    const formStyle = {
        backgroundColor: '#f8f9fa', // Gris suave para el fondo del formulario
        padding: '20px',
        borderRadius: '8px'
    };

    const inputStyle = {
        backgroundColor: '#e9ecef' // Gris más claro para el fondo de los cuadros de entrada
    };

    return (
        <div className="container mt-5">
            <h2>Formulario de Registro</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit} style={formStyle}>
                <div className="mb-3">
                    <label htmlFor="nombre" className="form-label">Nombre</label>
                    <input type="text" className="form-control" id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} style={inputStyle} />
                </div>
                <div className="mb-3">
                    <label htmlFor="apellidos" className="form-label">Apellidos</label>
                    <input type="text" className="form-control" id="apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} style={inputStyle} />
                </div>
                <div className="mb-3">
                    <label htmlFor="correo" className="form-label">Correo</label>
                    <input type="email" className="form-control" id="correo" value={correo} onChange={(e) => setCorreo(e.target.value)} style={inputStyle} />
                </div>
                <div className="mb-3">
                    <label htmlFor="telefono" className="form-label">Teléfono</label>
                    <input type="text" className="form-control" id="telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} style={inputStyle} />
                </div>
                <div className="mb-3">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input type="password" className="form-control" id="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
                </div>
                <button type="submit" className="btn btn-primary">Registrar</button>
            </form>
        </div>
    );
}

export default Registro;
