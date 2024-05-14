import React from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Navbar, Nav, Button, Container } from 'react-bootstrap';

const Navigation = ({ account }) => {
    const isAuthenticated = localStorage.getItem('isAuthenticated'); // Lee el estado de autenticación
    const navigate = useNavigate(); // Hook para navegar

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated'); // Borra el estado de autenticación
        navigate('/'); // Navega a la página de inicio
        window.location.reload(); // Recarga la página para refrescar el estado del componente
    };

    return (
        <Navbar expand="lg" bg="dark" variant="dark">
            <Container>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        {isAuthenticated && (
                            <>
                                <Nav.Link as={Link} to="/tokens">Tokens</Nav.Link>
                                <Nav.Link as={Link} to="/loteria">Loteria</Nav.Link>
                                <Nav.Link as={Link} to="/ganador">Ganador</Nav.Link>
                            </>
                        )}
                    </Nav>
                    <Nav className="ml-auto">
                        {!isAuthenticated && (
                            <>
                                <Nav.Link as={Link} to="/registro">Registro</Nav.Link>
                                <Nav.Link as={Link} to="/login">Iniciar Sesión</Nav.Link>
                            </>
                        )}
                        {isAuthenticated && (
                            <Button variant="outline-light" onClick={handleLogout}>Cerrar Sesión</Button>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default Navigation;
