import React, { Component } from 'react';
import smart_contract from '../abis/loteria.json';

import Web3 from 'web3';

import Swal from 'sweetalert2';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import Navigation from './Navbar';
import MyCarousel from './Carousel';

import { Container } from 'react-bootstrap';  // Estilos

class Tokens extends Component {

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
    this.setState({ account: accounts[0] }) // Guardamos la direccion que ha abierto el navegador
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
      errorMessage: ""  // Vamos a usar una estructura en las funciones try-catch. Si capturamos errores lo almacenamos aqui con state
    }
  }

  // FUNCIONES PARA VER EL BALANCE DEL USUARIO Y DEL SMART CONTRACT
  _balanceTokens = async () => {
    try {
      const _balance = await this.state.contract.methods.balanceTokens(this.state.account).call()
      console.log("Balance de tokens: ", _balance)

      // Todo esto esta sacado de la web de Sweetalert
      Swal.fire({
        icon: 'info',
        title: 'Tu balance de tokens V&D es:',
        width: 800,
        padding: '3em',
        text: `${_balance} tokens`, // Pasamos la variable
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

  _balanceTokensSC = async () => {
    try {
      const _balanceTokensSC = await this.state.contract.methods.balanceTokensSC().call()
      console.log("Balance de tokens del Smart Contract: ", _balanceTokensSC)
      Swal.fire({
        icon: 'info',
        title: 'Los tokens disponibles actualmente son:',
        width: 800,
        padding: '3em',
        text: `${_balanceTokensSC} tokens`,
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

  _balanceEthersSC = async () => {
    try {
      const _balanceEthersSC = await this.state.contract.methods.balanceEthersSC().call()
      console.log("El balance de Ethers del Smart Contract es: ", _balanceEthersSC)
      Swal.fire({
        icon: 'info',
        title: 'Balance de ethers del Smart Contract:',
        width: 800,
        padding: '3em',
        text: `${_balanceEthersSC} ETH`,
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


  _showLoteriaInfo = () => {
    Swal.fire({
      icon: 'info',
      title: '¿Cómo funciona la Lotería?',
      html: `
        <p style="text-align: justify;">
          Participa en loterías sobre apuestas de activos financieros, donde puedes apostar sobre el porcentaje de rentabilidad que han dado en el periodo especificado. Si tu apuesta es correcta, entras en un sorteo para ganar el bote acumulado sobre ese activo en el mismo periodo de apuesta.
        </p>
        <ol style="text-align: left;">
          <li> Compra tokens V&D, cuyo precio en ETH puedes consultar en la web.</li>
          <li> Selecciona el activo financiero sobre el cual deseas apostar y define tu apuesta.</li>
          <li> Compra tantos boletos como desees; a mayor número de boletos, mayores son tus probabilidades de ganar si aciertas la apuesta.</li>
          <li> Los ganadores se generan al vencimiento del plazo de la apuesta.</li>
          <li> Si ganas, se te transferirán los fondos acumulados de esa apuesta.</li>
        </ol>
        <p style="font-size: 12px; text-align: justify;">
          El usuario se llevará el 95% del bote final, siendo el 5% restante comisión de servicio. En caso de que ningún usuario acierte (altamente improbable), el bote será para la plataforma.
        </p>
      `,
      width: 800,
      padding: '3em',
      backdrop: `
        rgba(0,0,123,0.4)
        url("/images/nyan-cat.gif")
        left top
        no-repeat
      `
    });
  }
  

  // FUNCIONES PARA LA COMPRA Y DEVOLUCION DE TOKENS
  _compraTokens = async (_numTokens) => {
    try {
      const web3 = window.web3
      const ethers = web3.utils.toWei(_numTokens, 'ether')  // Convertimos a Wei ya que el SC necesita esa unidad
      await this.state.contract.methods.compraTokens(_numTokens).send({
        from: this.state.account,
        value: ethers
      })
      Swal.fire({
        icon: 'success',
        title: '¡Compra de tokens realizada!',
        confirmButtonText: 'Gracias!',
        width: 800,
        padding: '3em',
        text: `Has comprado ${_numTokens} token/s por un valor de ${ethers / 10 ** 18} ether/s`,
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

  render() {
    return (
      <div>
        <Navigation account={this.state.account} />
        <MyCarousel />
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
                <h1>Gestión de los Tokens ERC-20</h1>

                &nbsp;  {/*Espacio*/}
                &nbsp;
                <div className="text-center mt-4">
                  <button onClick={this._showLoteriaInfo} className="btn btn-info">
                    ¿Cómo funciona la Lotería?
                  </button>
                </div>

                &nbsp;  {/*Espacio*/}
                &nbsp;
                &nbsp;


                {/*SERÁ UNA FILA CON TRES COLUMNAS. CADA COLUMNA ES UN FORMULARIO*/}
                <Container>
                  <Row>
                    {/* PRIMERA COLUMNA: CONSULTAR TOKENS USUARIO */}
                    <Col>
                      <h3> Tus Tokens </h3>
                      <form onSubmit={(event) => {
                        event.preventDefault()  // Esto no se que hace del todo
                        this._balanceTokens()
                      }} >
                        <input type="submit"
                          className="bbtn btn-block btn-primary btn-sm"
                          value="BALANCE DE TOKENS V&D" />
                      </form>
                    </Col>

                    {/* SEGUNDA COLUMNA: CONSULTAR TOKENS DEL SC */}
                    <Col>
                      <h3> Tokens SC </h3>
                      <form onSubmit={(event) => {
                        event.preventDefault()
                        this._balanceTokensSC()
                      }} >
                        <input type="submit"
                          className="bbtn btn-block btn-primary btn-sm"
                          value="BALANCE DE TOKENS V&D (SC)" />
                      </form>
                    </Col>

                    {/* TERCERA COLUMNA: CONSULTAR ETHERS DEL SC (BOTE)*/}
                    <Col>
                      <h3> Ethers SC </h3>
                      <form onSubmit={(event) => {
                        event.preventDefault()
                        this._balanceEthersSC()
                      }}>
                        <input type="submit"
                          className="bbtn btn-block btn-primary btn-sm"
                          value="BALANCE DE ETHERS (SC)" />
                      </form>
                    </Col>
                  </Row>
                </Container>

                &nbsp;
                &nbsp;
                &nbsp;

                {/* COMPRA DE TOKENS */}
                <h3>Compra de Tokens ERC-20</h3>
                <form onSubmit={(event) => {
                  event.preventDefault()
                  const cantidad = this._numTokens.value // Recogemos el parametro que introduce el usuario en el input de abajo
                  this._compraTokens(cantidad)
                }}>
                  {/*Input para recoger el numero de tokens */}
                  <input type="number"
                    className="form-control mb-1"
                    placeholder="Cantidad de tokens a comprar"
                    ref={(input) => this._numTokens = input} />

                  <input type="submit"
                    className="bbtn btn-block btn-success btn-sm"
                    value="COMPRAR TOKENS" />
                </form>

              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default Tokens;
