import React, { Component } from 'react';
import smart_contract from '../abis/loteria.json';

import Web3 from 'web3';

import Swal from 'sweetalert2';

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import Navigation from './Navbar';
import MyCarousel from './Carousel';

// Nuevo: Form
import { Form, Button } from 'react-bootstrap';



class Loteria extends Component {

    async componentDidMount() {
        // 1. Carga de Web3
        await this.loadWeb3()
        // 2. Carga de datos de la Blockchain
        await this.loadBlockchainData()
    }

    // 1. Carga de Web3
    async loadWeb3() {
        if (window.ethereum) {
            window.web3 = new Web3(window.ethereum)
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            console.log('Accounts: ', accounts)
        }
        else if (window.web3) {
            window.web3 = new Web3(window.web3.currentProvider)
        }
        else {
            window.alert('¡Deberías considerar usar Metamask!')
        }
    }

    // 2. Carga de datos de la Blockchain
    async loadBlockchainData() {
        const web3 = window.web3
        const accounts = await web3.eth.getAccounts()
        this.setState({ account: accounts[0] })
        // Ganache -> 5777, Rinkeby -> 4, BSC -> 97
        const networkId = await web3.eth.net.getId()
        console.log('networkid:', networkId)
        const networkData = smart_contract.networks[networkId]
        console.log('NetworkData:', networkData)

        if (networkData) {
            const abi = smart_contract.abi
            console.log('abi', abi)
            const address = networkData.address
            console.log('address:', address)
            const contract = new web3.eth.Contract(abi, address)
            this.setState({ contract })
        } else {
            window.alert('¡El Smart Contract no se ha desplegado en la red!')
        }
    }

    constructor(props) {
        super(props)
        this.state = {
            account: '0x0',
            loading: true,
            contract: null,
            errorMessage: "",
            tipoActivo: '',
            activo: '',
            duracion: '',
            tipoPrediccion: '',
            rangoPrediccion: '',
        }
    }

    // FUNCION DE COMPRA DE BOLETOS
    _compraBoletos = async (_numBoletos) => {
        // Verificamos que todos los campos están completos
        const { tipoActivo, activo, duracion, tipoPrediccion, rangoPrediccion } = this.state;
        const numBoletos = this._numBoletos.value;
        const duracionInt = parseInt(duracion); // Convertimos a entero ya que el SC espera un uint en este campo

        // Si algún campo está vacío, mostrar SweetAlert
        if (!tipoActivo || !activo || !duracion || !tipoPrediccion || !rangoPrediccion || !numBoletos) {

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Por favor, complete todos los campos antes de comprar boletos.',
                confirmButtonText: 'Entendido',
                width: 800,
                padding: '3em',
                backdrop: `
                    rgba(0,0,123,0.4)
                    url("/images/nyan-cat.gif")
                    left top
                    no-repeat
                `
            });
            return; // Salir de la función para no proceder con la compra
        }

        try {
            console.log("Compra de boletos: ", _numBoletos)
            console.log("Datos del boleto: ", tipoActivo, activo, duracion, tipoPrediccion, rangoPrediccion)

            // Enviamos los datos al SC
            await this.state.contract.methods.compraBoleto(_numBoletos, tipoActivo, activo, duracionInt, tipoPrediccion, rangoPrediccion).send({
                from: this.state.account
            })

            Swal.fire({
                icon: 'success',
                title: 'Compra de boletos completada',
                width: 800,
                padding: '3em',
                text: `Has comprado ${_numBoletos} boletos`,
                backdrop: `
              rgba(15, 238, 168, 0.2)
              left top
              no-repeat
            `
            })

        } catch (err) {
            this.setState({ errorMessage: err })
            Swal.fire({
                icon: 'error',
                title: 'Error en la transacción',
                text: 'Hubo un problema al realizar la compra de boletos. Intentelo más tarde.',
                width: 800,
                padding: '3em',
                backdrop: `
                    rgba(0,0,123,0.4)
                    url("/images/nyan-cat.gif")
                    left top
                    no-repeat
                `
            });
        } finally {
            this.setState({ loading: false })
        }
    }

    // FUNCION PARA MOSTRAR EL PRECIO DEL BOLETO
    _precioBoleto = async () => {
        try {
            const _precio = await this.state.contract.methods.precioBoleto().call()
            console.log("Precio del boleto: ", _precio)
            Swal.fire({
                icon: 'info',
                title: `El precio del boleto es de ${_precio} tokens (ERC-20)`,
                width: 800,
                padding: '3em',
                backdrop: `
              rgba(15, 238, 168, 0.2)
              left top
              no-repeat
            `
            })
        } catch (err) {
            this.setState({ errorMessage: err })
        } finally {
            this.setState({ loading: false })
        }
    }

    // Método para obtener metadatos de un NFT dado su tokenId (La llama _tusBoletos)
    getNFTMetadata = async (tokenId) => {
        try {
            const metadata = await this.state.contract.methods.getNFTMetadata(tokenId).call();
            console.log("Metadatos del NFT:", metadata);
            return metadata;
        } catch (error) {
            console.error("Error al obtener los metadatos del NFT:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error al obtener información',
                text: 'No se pudo recuperar la información del NFT.',
                confirmButtonText: 'Cerrar'
            });
        }
    }

    // FUNCION PARA VER QUE BOLETOS TIENE EL USUARIO
    _tusBoletos = async () => {
        try {
            const _boletos = await this.state.contract.methods.tusBoletos(this.state.account).call();
            console.log("Tus boletos: ", _boletos);
    
            // Construir la tabla HTML
            let tableHtml = '<table style="width:100%"><tr><th>ID</th><th>Tipo Activo</th><th>Activo</th><th>Duración</th><th>Tipo Predicción</th><th>Rango Predicción</th></tr>';
            _boletos.forEach(boleto => {
                tableHtml += `<tr>
                                <td>${boleto.tokenId}</td>
                                <td>${boleto.metadata.tipoActivo}</td>
                                <td>${boleto.metadata.activo}</td>
                                <td>${boleto.metadata.duracion}</td>
                                <td>${boleto.metadata.tipoPrediccion}</td>
                                <td>${boleto.metadata.rangoPrediccion}</td>
                              </tr>`;
            });
            tableHtml += '</table>';
    
            Swal.fire({
                icon: 'info',
                title: 'Tu historial de boletos',
                width: 800,
                html: tableHtml, // Usar html en lugar de text para renderizar la tabla
                padding: '3em',
                backdrop: `
                    rgba(15, 238, 168, 0.2)
                    left top
                    no-repeat
                `
            });
    
        } catch (err) {
            console.error("Error al obtener los boletos del usuario:", err);
            this.setState({ errorMessage: err });
            Swal.fire({
                icon: 'error',
                title: 'Error al obtener boletos',
                text: 'Hubo un problema al intentar recuperar tus boletos.',
                confirmButtonText: 'Cerrar'
            });
        } finally {
            this.setState({ loading: false });
        }
    };
    



    // NUEVO: Handler para guardar la opcion elegida por el usuario en el estado del constructor pertinente
    handleOptionChange = (event) => {
        // Actualizamos el estado con el valor seleccionado del desplegable
        const { name, value } = event.target;
        this.setState({ [name]: value });
        console.log(name, value);

        // Si cambia el tipo de activo, restablecemos el identificador del activo
        if (name === "tipoActivo") {
            this.setState({ activo: '' });
        }
    };


    render() {
        return (
            <div>
                <Navigation account={this.state.account} />
                <MyCarousel />
                <div className="container-fluid mt-5">
                    <div className="row">
                        <main role="main" className="col-lg-12 d-flex text-center">
                            <div className="content mr-auto ml-auto">
                                <h1>Gestión de la Lotería Financiera</h1>

                                {/*Recogemos el valor que introduce el usuario de numero de boletos*/}
                                <Form onSubmit={(event) => {
                                    event.preventDefault();
                                    const cantidad = this._numBoletos.value;
                                    this._compraBoletos(cantidad);
                                }}>

                                    &nbsp;

                                    {/* Primera fila de cuadros desplegables (3) */}
                                    <Row>
                                        <Col>
                                            <Form.Group controlId="tipoActivo">
                                                <Form.Label>Tipo de activo</Form.Label>
                                                <Form.Control as="select" name="tipoActivo" value={this.state.tipoActivo} onChange={this.handleOptionChange}>
                                                    <option value="">Seleccione una opción</option>
                                                    <option value="Indice">Índice</option>
                                                    <option value="Acciones">Acciones</option>
                                                </Form.Control>
                                            </Form.Group>
                                        </Col>
                                        <Col>
                                            <Form.Group controlId="activo">
                                                <Form.Label>Identificador del activo</Form.Label>
                                                <Form.Control as="select" name="activo" value={this.state.activo} onChange={this.handleOptionChange}>
                                                    <option value="">Seleccione una opción</option>
                                                    {this.state.tipoActivo === "Indice" && (
                                                        <>
                                                            <option value="IBEX35">IBEX35</option>
                                                            <option value="DAX30">DAX30</option>
                                                            <option value="FTSE100">FTSE100</option>
                                                        </>
                                                    )}
                                                    {this.state.tipoActivo === "Acciones" && (
                                                        <>
                                                            <option value="SAN">SAN</option>
                                                            <option value="BBVA">BBVA</option>
                                                            <option value="TEF">TEF</option>
                                                        </>
                                                    )}
                                                </Form.Control>

                                            </Form.Group>
                                        </Col>
                                        <Col>
                                            <Form.Group controlId="duracion">
                                                <Form.Label>Duración del ticket (días)</Form.Label>
                                                <Form.Control as="select" name="duracion" value={this.state.duracion} onChange={this.handleOptionChange}>
                                                    <option value="">Seleccione una opción</option>
                                                    <option value="1">1</option>
                                                    <option value="2">2</option>
                                                    <option value="3">3</option>
                                                    <option value="4">4</option>
                                                </Form.Control>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    {/* Segunda fila de cuadros desplegables (2)*/}
                                    <Row>
                                        <Col>
                                            <Form.Group controlId="tipoPrediccion">
                                                <Form.Label>Tipo de predicción</Form.Label>
                                                <Form.Control as="select" name="tipoPrediccion" value={this.state.tipoPrediccion} onChange={this.handleOptionChange}>
                                                    <option value="">Seleccione una opción</option>
                                                    <option value="Subida">Subida</option>
                                                    <option value="Bajada">Bajada</option>
                                                </Form.Control>
                                            </Form.Group>
                                        </Col>
                                        <Col>
                                            <Form.Group controlId="rangoPrediccion">
                                                <Form.Label>Rango de predicción</Form.Label>
                                                <Form.Control as="select" name="rangoPrediccion" value={this.state.rangoPrediccion} onChange={this.handleOptionChange}>
                                                    <option value="">Seleccione una opción</option>
                                                    <option value="0.10 - 0.15">0.10 - 0.15</option>
                                                    <option value="0.15 - 0.20">0.15 - 0.20</option>
                                                    <option value="0.20 - 0.25">0.20 - 0.25</option>
                                                    <option value="0.25 - 0.30">0.25 - 0.30</option>
                                                </Form.Control>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    &nbsp;

                                    {/* Fila para ingresar la cantidad de boletos a comprar */}
                                    <Row>

                                        <Col>
                                            <Form.Group controlId="NumBoletos">
                                                <Form.Label><h4>Cantidad de boletos a comprar</h4></Form.Label>
                                                <Form.Control type="number" placeholder="Cantidad de boletos" ref={(input) => this._numBoletos = input} />
                                            </Form.Group>
                                            <Button type="submit" className="btn btn-primary btn-block">Comprar Boletos</Button>
                                        </Col>
                                    </Row>

                                    &nbsp;

                                    {/* Fila para consultar el precio de los boletos y ver los boletos del usuario */}
                                    <Row>
                                        <Col>
                                            <Button onClick={this._precioBoleto} className="btn btn-danger btn-block">Precio del Boleto</Button>
                                        </Col>
                                        <Col>
                                            <Button onClick={this._tusBoletos} className="btn btn-success btn-block">Tus Boletos</Button>
                                        </Col>
                                    </Row>
                                </Form>
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        );

    }
}

export default Loteria;
