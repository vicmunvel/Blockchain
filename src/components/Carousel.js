import React, { Component } from 'react';
import Carousel from 'react-bootstrap/Carousel';
import img1 from '../img/Logo.JPG';
import img2 from '../img/Logo3.JPG';
import img3 from '../img/Logo4.JPG';

class MyCarousel extends Component {
    render() {
        return (
            <Carousel>
                <Carousel.Item>
                        <img
                            className="d-block w-100"
                            src={img1}
                            alt=''
                        />
                </Carousel.Item>
                <Carousel.Item>
                        <img
                            className="d-block w-100"
                            src={img2}
                            alt=''
                        />
                </Carousel.Item>
                <Carousel.Item>
                        <img
                            className="d-block w-100"
                            src={img3}
                            alt=''
                        />
                    
                </Carousel.Item>
            </Carousel>

        );
    }
}

export default MyCarousel;
