// SPDX-License-Identifier: MIT

// Version del compilador
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; // Para aquellas acciones que solo el dueño pueda usar
import "./mainERC721.sol";
import "./boletosNFTs.sol";

contract  loteria is ERC20, Ownable{
    // Sabemos que ERC20 y ERC721 usan funciones que algunas se llaman igual. Tendremos conflicto si ambas las heredamos
    // Heredamos el ERC20 y Ownable

    //===========================
    // Gestion de los tokens
    //===========================

    // Direccion del contrato NFT del proyecto: El que gestiona estos
    address public nft;

    // Constructor
    // Vamos a crear los tokens ERC20 
    constructor() ERC20("Loteria", "VM"){
        _mint(address(this), 1000);    // Ponemos la direccion del propio Smart Contract en vez del sender para que este no se lleve los tokens
        // Vamos a hacer que cuando se despliegue este contratro se despliegue automaticamente el siguiente
        nft = address(new mainERC721());
    }

    // Variables
    // Ganador del premio de la loteria (Igual por seguridad se puede quitar)
    // Aunque la blockchain es publica y se acabaria viendo al emitir el premio
    address public ganador;
    
    // Estructura de datos para que los users puedan gestionar sus propios contratos
    // Este contrato no, solo pueden aqui comprar y recibir. En esos seran owners
    // Registro de usuarios
    mapping (address => address) public usuario_contract;


    // Precio de los tokens ERC20 - 1 Ether hemos puesto a cada token que quieran comprar
    // Internal: Solo accedemos nosotros a ella, no los usuarios. 
    // Pure: No accedemos a la Blockchain
    function precioTokens(uint256 _numTokens) internal pure returns (uint256){
        return _numTokens * (1 ether);  // Bastante caro jejeje
    }

    // Funcion para controlar el balance que tiene una persona.
    // ERC20 ya tiene una que hace esto pero la retocamos
    // Visualizacion del balance de tokens ERC20 del usuario
    function balanceTokens(address _account) public view returns (uint256){
        return balanceOf(_account);
    }

    // Creamos una funcion estatica que me de cuantos tokens tiene el Smart Contract pero sin especificar la misma
    // Visualizacion del balance de tokens ERC20 del Smart Contract
    function balanceTokensSC() public view returns (uint256){
        return balanceOf(address(this));
    }

    // Visualizacion del balance de ethers del Smart Contract (BOTE)
    // 1 ether = 10^18 Wei
    function balanceEthersSC() public view returns (uint256){
        return address(this).balance / 10**18; // (Funcion propia de Solidity. Devuelve Wei)
    }

    // Funcion que nos permita aumentar los tokens ERC20 por si se nos quedan cortos por que tenemos muchos usuario
    // Solo ejecutable por el Owner
    function mint(uint256 _cantidad) public onlyOwner {
        _mint(address(this), _cantidad);
    }


    // Registro de usuarios - Factory
    // Con esto se pretende que el usuario se registre de forma automatica cuando realice su primera compra
    // Creará un SC secundario de gestion para cada uno
    function registrar() internal {
        address addr_personal_contract = address(new boletosNFTs(msg.sender, address(this), nft));
        usuario_contract[msg.sender] = addr_personal_contract;

    }

    // Informacion de un usuario
    function usersInfo(address _account) public view returns (address){
        return usuario_contract[_account];
    }


    // ===================================
    // Compra y devolucion de Tokens ERC20
    // ===================================

    // Compra de tokens ERC20
    function compraTokens(uint256 _numTokens) public payable {
        
        // Hacemos que cada vez que una persona compra tokens se registre automaticamente
        // Si no tiene un contrato de boleto asignado significa que es la primera vez que lo hace
        if(usuario_contract[msg.sender] == address(0)){
            registrar();
        }

        // Establecemos el costre de los tokens a comprar
        uint256 coste = precioTokens(_numTokens);
        
        // Evaluamos el dinero que el cliente va a pagar por los tokens
        require(msg.value >= coste, "Compra menos tokens o paga con mas Ethers");

        // Evaluamos el balance de tokens del Smart Contract
        uint256 balance = balanceTokensSC();
        require(_numTokens <= balance, "Compra un numero menor de tokens");

        // Devolucion del dinero sobrante. Ej: El cliente compra con 10 ethers y solo gast 8, devolvemos 2
        uint256 returnValue = msg.value - coste;

        // Se hace el pago de la devolucion
        // Ponemos la direccion de a quien enviamos la cantidad
        payable(msg.sender).transfer(returnValue);  // transfer es una funcion interna de Solidity para ethers

        // Enviamos los tokens al cliente/usuario. 
        _transfer(address(this), msg.sender, _numTokens); // Funcion del estandar ERC20 para enviar tokens

        // NO PONEMOS UNA FUNCION O CODIGO DE QUE EL USUARIO ESTA PAGANDO AL SMART CONTRAC YA QUE LA FUNCION ES PAYABLE
        // TODO LO QUE EL USUARIO PONGA EN EL MSG.VALUE SE ENVIARÁ A ESTA FUNCION

    }

    // Devolucion de tokens. Ej: El usuario compro 10 tokens y al final solo gasta 5 en boletos, devolvemos esos 5 sobrantes
    function devolverTokens (uint _numTokens) public payable {
        
        // El numero de Tokens debe ser mayor a 0
        require(_numTokens >= 0, "Necesitas devolver un numero de tokens mayor a 0");

        // El usuario debe acreditar tener los tokens que quiere devolver
        require(_numTokens <= balanceTokens(msg.sender), "No tienes los tokens que deseas devolver");

        // Hacemos la transferencia. 
        // El usuario transfiere tokens al SC
        _transfer(msg.sender, address(this), _numTokens);   // Funcion del estandar ya que son ERC20

        // El SC envia los ethers al usuario
        payable(msg.sender).transfer(precioTokens(_numTokens)); // Funcion de Solidity

    }



    // =====================
    // Gestion de la loteria
    // =====================
    
    // Precio del boleto de la loteria (en tokens ERC20)
    uint public precioBoleto = 5;
    // Relacion: Persona que compra boletos - numero de boletos que tiene
    mapping (address => uint[]) idPersona_boletos;
    // Relacion: boleto -> ganador
    mapping (uint => address) ADNBoleto;
    // Numero aleatorio
    uint randNonce = 0;
    // Boletos de la loteria generados
    uint [] boletosComprados;

    // Compra de boletos de loteria
    function compraBoleto(uint _numBoletos, string memory tipoActivo, string memory activo, uint duracion, string memory tipoPrediccion, string memory rangoPrediccion) public{
        
        // Precio total de los boletos a comprar
        uint precioTotal = _numBoletos*precioBoleto;
        // Verificamos que el usuario tenga los tokens
        require(precioTotal <= balanceTokens(msg.sender), "No tienes tokens suficientes");
        // Transferencia de tokens del usuario al SC
        _transfer(msg.sender, address(this), precioTotal);

        // Generamos los boletos de loteria
        for(uint i=0; i < _numBoletos; i++){

            // Creamos un nuevo contrato del usuario y // Llamamos a la funcion que crea el boleto que nos devuelve el identificador
            boletosNFTs contractNFT = boletosNFTs(usuario_contract[msg.sender]);
            uint256 newTokenId = contractNFT.mintBoleto(msg.sender, tipoActivo, activo, duracion, tipoPrediccion, rangoPrediccion);

            // Almacenar el nuevo tokenId y los metadatos
            idPersona_boletos[msg.sender].push(newTokenId);
            boletosComprados.push(newTokenId);
            ADNBoleto[newTokenId] = msg.sender;
            //bytes32 metaHash = hashMetadatos(tipoActivo, activo, duracion);
            //if (!metaHashExists[metaHash]) {
              //  uniqueMetaHashes.push(metaHash);
                //metaHashExists[metaHash] = true;
            //}
            //boletosPorMetadatos[metaHash].push(newTokenId);
        }
    }

    struct BoletoMetadata {
            uint tokenId;
            mainERC721.NFTMetadata metadata;
    }

    // Visualizacion de los boletos del usuario
    function tusBoletos(address _propietario) public view returns(BoletoMetadata[] memory){
        
        uint[] memory boletosIds = idPersona_boletos[_propietario];
        BoletoMetadata[] memory boletosInfo = new BoletoMetadata[](boletosIds.length);

        for (uint i = 0; i < boletosIds.length; i++) {
            uint tokenId = boletosIds[i];
            mainERC721.NFTMetadata memory metadata = mainERC721(nft).getNFTMetadata(tokenId);
            boletosInfo[i] = BoletoMetadata(tokenId, metadata);
        }

        return boletosInfo;
    }



    // Generacion del ganador de la loteria
    function generarGanador() public onlyOwner{
        
        // Declaracion de la longitud del array
        uint longitud = boletosComprados.length;

        // Verificamos que al menos se haya comprado un boleto
        require(longitud >= 0, "No hay boletos comprados");

        // Eleccion aleatoria de un numero entre 0 y longitud
        uint random = uint(uint(keccak256(abi.encodePacked(block.timestamp))) % longitud);
        
        // Seleccionamos el numero
        uint eleccion = boletosComprados[random];

        // Direccion del ganador de la loteria
        ganador = ADNBoleto[eleccion];

        // Damos la recompensa al ganador (95% del total) - ENVIAMOS ETHERS
        payable(ganador).transfer(address(this).balance * 95/100); // Esta funcion ya que son Ethers

        // Enviamos el 5% al owner del SC (nosotros)
        payable(owner()).transfer(address(this).balance * 5/100);
    }

}

