import React, { Component } from 'react';
import smart_contract from '../abis/gestorGanadores.json';
import Web3 from 'web3';
import Swal from 'sweetalert2';

import Navigation from './Navbar';
import MyCarousel from './Carousel';

class Ganador extends Component {

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
      errorMessage: ""
    }
  }

  _generarGanador = async () => {
    this.setState({ loading: true });
    try {
      const monto = await this.state.contract.methods.generarGanador().send({ from: this.state.account });
      console.log("CANTIDAD GANADA POR EL USUARIO:", monto);
      Swal.fire({
        icon: 'success',
        title: '¡Ganador generado correctamente!',
        width: 800,
        padding: '3em',
        backdrop: `
          rgba(15, 238, 168, 0.2)
          left top
          no-repeat
        `
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: '¡Error al generar el ganador!',
        text: `${err.message}`,
        width: 800,
        padding: '3em',
        backdrop: `
          rgba(255, 0, 0, 0.4)
          left top
          no-repeat
        `
      });
    } finally {
      this.setState({ loading: false });
    }
  }

  _obtenerGanadores = async () => {
    this.setState({ loading: true });
    try {
        const ganadores = await this.state.contract.methods.getGanadoresConDetalles().call();
        console.log("Ganadores: ", ganadores);

        // Construir la tabla HTML
        let tableHtml = '<table style="width:100%"><tr><th>Dirección</th><th>Boleto ID</th><th>Tipo Activo</th><th>Identificador Activo</th><th>Duración</th></tr>';
        ganadores.forEach(g => {
            tableHtml += `<tr>
                            <td>${g.direccion}</td>
                            <td>${g.boletoId}</td>
                            <td>${g.detallesLoteria.tipoActivo}</td>
                            <td>${g.detallesLoteria.identificadorActivo}</td>
                            <td>${g.detallesLoteria.duracion}</td>
                          </tr>`;
        });
        tableHtml += '</table>';

        Swal.fire({
            icon: 'info',
            title: 'Ganadores cargados correctamente',
            width: 1200,
            html: tableHtml, // Usar html en lugar de text para renderizar la tabla
            padding: '3em',
            backdrop: `
                rgba(15, 238, 168, 0.2)
                left top
                no-repeat
            `
        });

    } catch (err) {
        console.error("Error al cargar los ganadores:", err);
        Swal.fire({
            icon: 'error',
            title: 'Error al cargar los ganadores',
            text: `${err.message}`,
            width: 800,
            padding: '3em'
        });
    } finally {
        this.setState({ loading: false });
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

                {/*Formulario para generar el ganador*/}
                <h1> Generación de un ganador en la Lotería</h1>
                <form onSubmit={(event) => {
                  event.preventDefault()
                  this._generarGanador()
                }}>
                  <input type="submit"
                    className="bbtn btn-block btn-info btn-sm"
                    value="GENERAR GANADOR" />
                </form>

                &nbsp;

                {/*Formulario para ver el ganador*/}
                <form onSubmit={(event) => {
                  event.preventDefault();
                  this._obtenerGanadores();
                }}>
                  <input type="submit"
                    className="btn btn-block btn-warning btn-sm"
                    value="VER GANADORES" />
                </form>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default Ganador;
