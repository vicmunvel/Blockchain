import React, { Component } from 'react';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Registro from './Registro';
import Tokens from './Tokens';
import Footer from './Footer';
import Loteria from './Loteria';
import Ganador from './Ganador';
import Login from './Login';
import Info from './Info';


class App extends Component {
    
    render() {
        return (
            <BrowserRouter>
                <div className="App">
                    <div>
                        <Routes>
                            <Route path="/" element={<Info />} />
                            <Route path="/tokens" element={<Tokens />} />
                            <Route path="/loteria" element={<Loteria />} />
                            <Route path="/ganador" element={<Ganador />} />
                            <Route path="/registro" element={<Registro />} />
                            <Route path="/login" element={<Login />} />
                        </Routes>
                    </div>
                    <Footer />
                </div>
            </BrowserRouter>
        );
    }

}

export default App;