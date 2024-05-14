import React, { Component } from 'react';
import Swal from 'sweetalert2';
import Navigation from './Navbar';
import MyCarousel from './Carousel';

class Info extends Component {

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
render() {

    return (
            <div>
              <Navigation />
              <MyCarousel />
              <div className="container-fluid mt-5">
                <div className="row">
                  <main role="main" className="col-lg-12 d-flex text-center">
                    <div className="content mr-auto ml-auto">
                      <h1>Información de nuestros servicios</h1>
      
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
                    </div>
            </main>
          </div>
        </div>
      </div>
    )
}

}

export default Info;