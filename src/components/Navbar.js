import React from 'react';
import { Link } from "react-router-dom";
import { Navbar, Nav, Container } from 'react-bootstrap';

const Navigation = ({ account }) => {
    return (
        <Navbar expand="lg" bg="dark" variant="dark">
            <Container>
                <Navbar.Brand as={Link} to="/">
                    &nbsp; DApp
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="navbar navbar-dark bg-primary" />
                <Navbar.Collapse id="navbar navbar-dark bg-primary">
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to="/">Tokens</Nav.Link>
                        <Nav.Link as={Link} to="/loteria">Loteria</Nav.Link>
                        <Nav.Link as={Link} to="/ganador">Ganador</Nav.Link>
                    </Nav>                    
                </Navbar.Collapse>
            </Container>
        </Navbar>
    )

}

export default Navigation;