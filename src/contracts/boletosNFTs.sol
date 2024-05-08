// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./mainERC721.sol";

contract boletosNFTs{

    // Estructura de datos
    // Datos relevantes del propietario
    struct Owner{
        address direccionPropietario;
        address contratoPadre;
        address contratoNFT;
        address contratoUsuario; // Esta variable define a este mismo Smart Contract
    }

    Owner public propietario;

    // Constructor. Aqui definimos la informacion que va a recibir de Registro
    constructor(address _propietario, address _contratoPadre, address _contratoNFT) {
        
        // Una manera de hacerlo:
        // propietario = Owner(_propietario, _contratoPadre, _contratoNFT, address(this));

        // Otra manera:
        propietario.direccionPropietario = _propietario;
        propietario.contratoPadre = _contratoPadre;
        propietario.contratoNFT = _contratoNFT;
        propietario.contratoUsuario = address(this);
    }


    // Conversion de los numeros de los boletos de loteria a un NFT
    // safeMint crea tokens NFTs. Esta funcion haria lo mismo? Vamos a llamar a esa funcion de otro SC. Asi lo vemos
    function mintBoleto(address _propietario, string memory tipoActivo, string memory activo, uint duracion, string memory tipoPrediccion, string memory rangoPrediccion) public returns (uint256){
        
        // Añadimos este require para que solo lo ejecute el SC loteria
        require(msg.sender == propietario.contratoPadre,"No tiene permisos para ejecutar esta funcion");

        // Puede haber varios mainERC721, referenciamos a su direccion: mainERC721(direccion)
        // La funcion es internal, solo se puede usar por herencia
        // O hacemos la funcion publica pero eso es un peligro
        // Esta funcion tampoco puede ser publica ya que se llama a la otra funcion. Mucho cuidado
        // Filtramos para que pueda acceder solo el SC que queremos
        // Devolvemos el identificador
        mainERC721 contratoNFT = mainERC721(propietario.contratoNFT);
        return contratoNFT.safeMint(_propietario, tipoActivo, activo, duracion, tipoPrediccion, rangoPrediccion);
    }
}