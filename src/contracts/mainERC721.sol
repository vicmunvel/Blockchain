// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./loteria.sol";

contract mainERC721 is ERC721{

    // Empleamos esa funcionalidad de openzeppelin para el conteo de tokens
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Gracias a esta podremos llamar a usersInfo y comprobar quien llama a safeMint
    address public direccionLoteria;

    // Estructura para almacenar los metadatos de cada NFT
    struct NFTMetadata {
        string tipoActivo;
        string activo;
        uint duracion;
        string tipoPrediccion;
        string rangoPrediccion;
    }

    // Mapping de tokenId a sus metadatos
    mapping(uint256 => NFTMetadata) public tokenMetadatos;

    // Aqui si que lo puedo colocar como herencia ya que no habra colapso de funciones por que es otro contrato distinto
    constructor() ERC721("Loteria", "STE"){
        // Recordar que este SC se despliega automáticamente por loteria, por lo que el sender es ese SC
        direccionLoteria = msg.sender;
    }

    // Creacion de NFTs. Esta funcion no puede ser public, ya que todos emitirian
    // Esta funcion queremos que la llame unicamente el SC boletosNFT. Para eso usamos usersInfo
    function safeMint(address _propietario, string memory tipoActivo, string memory activo, uint duracion, string memory tipoPrediccion, string memory rangoPrediccion) public returns(uint256){

        // Solo puede ejecutar esta funcion el SC de boletoNFT de ese propietario
        require(msg.sender == loteria(direccionLoteria).usersInfo(_propietario), "No tienes permisos para ejecutar esta funcion");

        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _safeMint(_propietario, newItemId);   // Funcion propia del estandar 

        // Almacenar metadatos
        tokenMetadatos[newItemId] = NFTMetadata(tipoActivo, activo, duracion, tipoPrediccion, rangoPrediccion);
        return newItemId;
    }

    // Función para obtener los metadatos de un NFT. Getter para mostrar la info a User
    function getNFTMetadata(uint256 tokenId) public view returns (NFTMetadata memory) {
        require(_exists(tokenId), "ERC721Metadata: Metadata query for nonexistent token");
        return tokenMetadatos[tokenId];
    }

}