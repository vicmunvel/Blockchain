import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
    const [correo, setCorreo] = useState('');
    const [password, setPassword] = useState('');
    const [loginStatus, setLoginStatus] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const validateForm = () => {
        if (!correo || !password) {
            setError('Por favor, complete todos los campos.');
            return false;
        }
        setError('');
        return true;
    };

    const handleLogin = async (event) => {
        event.preventDefault();
        if (!validateForm()) {
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/login', { correo, password });
            if (response.data.success) {
                localStorage.setItem('isAuthenticated', 'true');
                setLoginStatus('Bienvenido!');
                alert('Bienvenido!');
                navigate('/');
            } else {
                setLoginStatus('Correo o contraseña incorrectos. Por favor, inténtalo de nuevo o regístrate.');
                alert('Correo o contraseña incorrectos. Por favor, inténtalo de nuevo o regístrate.');
            }
        } catch (error) {
            console.error('Error al iniciar sesión', error);
            alert('Error al conectar al servidor');
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
            <h2>Iniciar Sesión</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleLogin} style={formStyle}>
                <div className="mb-3">
                    <label htmlFor="correo" className="form-label">Correo</label>
                    <input type="email" className="form-control" id="correo" value={correo} onChange={(e) => setCorreo(e.target.value)} style={inputStyle} />
                </div>
                <div className="mb-3">
                    <label htmlFor="password" className="form-label">Contraseña</label>
                    <input type="password" className="form-control" id="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
                </div>
                <button type="submit" className="btn btn-primary">Iniciar Sesión</button>
            </form>
            <div>{loginStatus}</div>
        </div>
    );
}

export default Login;
