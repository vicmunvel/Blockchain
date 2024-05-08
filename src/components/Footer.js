import React from "react";

const MyFooter = () => (
    <footer style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }} className='text-center text-lg-start text-muted'>
      <section className='border-bottom'>
        <div className='container text-center text-md-start mt-5'>
        &nbsp;
          <div className='row mt-3'>
            <div className='col-md-3 col-lg-4 col-xl-3 mx-auto mb-4'>
              <h6 className='text-uppercase fw-bold mb-4'>
                <i className='fas fa-gem me-3'></i>Lotería financiera V&D
              </h6>
              <p>
              Realiza tus apuestas de lotería sobre los mercados financieros en nuestra Dapp
              </p>
            </div>

            <div className='col-md-2 col-lg-2 col-xl-2 mx-auto mb-4'>
              <h6 className='text-uppercase fw-bold mb-4'>Curso</h6>
              <p>Master Universitario Fintech</p>
              <p>Universidad Carlos III</p>
              <p>Blockchain y Tecnologías de Seguridad</p>
            </div>
            <div className='col-md-4 col-lg-3 col-xl-3 mx-auto mb-md-0 mb-4'>
              <h6 className='text-uppercase fw-bold mb-4'>Contacto</h6>
              <p>Víctor Muñoz</p>
              <p>100516557@alumnos.uc3m.es</p>
              <p>Diego Bayón</p>
              <p>100510757@alumnos.uc3m.es</p>
            </div>
          </div>
        </div>
      </section>
    </footer>
);

export default MyFooter;