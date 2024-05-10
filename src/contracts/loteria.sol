// SPDX-License-Identifier: MIT

// Version del compilador
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./mainERC721.sol";
import "./boletosNFTs.sol";
import "./gestorGanadores.sol";

contract  loteria is ERC20{

    // CONSTRUCTOR
    constructor(address payable _gestorGanadoresAddress) ERC20("LoteriaV&D", "V&D"){
        owner = msg.sender;
        _mint(address(this), 1000);     // Ponemos la direccion del propio Smart Contract en vez del sender para que este no se lleve los tokens
        nft = address(new mainERC721());    // Vamos a hacer que cuando se despliegue este contratro se despliegue automaticamente mainNFT
        ganadoresAdress = payable(_gestorGanadoresAddress);
        contractGanadores = gestorGanadores(_gestorGanadoresAddress);
        contractGanadores.setLoteriaAddress(address(this)); // Enviamos la direccion de este contrato al de gestion de ganadores
    }

    // VARIABLES
    address public owner;
    address public nft;
    address payable public ganadoresAdress;
    gestorGanadores public contractGanadores; 
    uint256 public precioToken = 1 ether;   // 1 Ether por Token ERC20
    uint public precioBoleto = 5;           // 5 Tokens ERC-20
    uint [] boletosComprados;
    bytes32[] uniqueMetaHashes;

    // MAPPINGS
    mapping (address => address) public usuario_contract;   
    mapping (address => uint[]) idPersona_boletos;          // Relacion: Persona que compra boletos - numero de boletos que tiene
    mapping (uint => address) ADNBoleto;                    // Relacion: boleto -> ganador

    // ESTRUCTURAS DE DATOS
    struct BoletoMetadata {
            uint tokenId;
            mainERC721.NFTMetadata metadata;
    }

    // MODIFICADORES
    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    //===========================
    // Gestion de los tokens
    //===========================

    // FUNCION: Calculamos el precio de los tokens que se van a comprar
    function precioTokens(uint256 _numTokens) internal view returns (uint256){
        return _numTokens * precioToken;
    }

    // FUNCION: Obtenemos el balance de tokens ERC20 del usuario
    function balanceTokens(address _account) public view returns (uint256){
        return balanceOf(_account);
    }

    // FUNCION: Obtenemos el balance de tokens ERC20 del Smart Contract
    function balanceTokensSC() public view returns (uint256){
        return balanceOf(address(this));
    }

    // FUNCION: Obtenemos el balance de Ethers del contrato que gestiona el bote
    function balanceEthersSC() public view returns (uint256){
        return ganadoresAdress.balance / 10**18; // (Funcion propia de Solidity. Devuelve Wei) -> 1 ether = 10^18 Wei
    }

    // FUNCION: Aumentamos los tokens ERC20 por si se nos quedan cortos por que tenemos muchos usuarios
    function mint(uint256 _cantidad) public onlyOwner {
        _mint(address(this), _cantidad);
    }

    // FUNCION: Registramos automáticamente a un usuario al realizar su primera compra
    function registrar() internal {
        address addr_personal_contract = address(new boletosNFTs(msg.sender, address(this), nft));
        usuario_contract[msg.sender] = addr_personal_contract;

    }

    // FUNCION: Obtenemos la direccion del contrato que gestiona el usuario
    function usersInfo(address _account) public view returns (address){
        return usuario_contract[_account];
    }


    // ===================================
    // Compra y devolucion de Tokens ERC20
    // ===================================

    // FUNCION: Compra de tokens ERC20
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

        enviarFondosAGestor(msg.value-returnValue);
    }

    // ESTA FUNCION NO LA PONEMOS POR QUE SINO SUPERA EL SIZE CODE EL CONTRATO
    // Devolucion de tokens. Ej: El usuario compro 10 tokens y al final solo gasta 5 en boletos, devolvemos esos 5 sobrantes
    //function devolverTokens (uint _numTokens) public payable {
        
        // El numero de Tokens debe ser mayor a 0
        //require(_numTokens >= 0, "Necesitas devolver un numero de tokens mayor a 0");

        // El usuario debe acreditar tener los tokens que quiere devolver
        //require(_numTokens <= balanceTokens(msg.sender), "No tienes los tokens que deseas devolver");

        // Hacemos la transferencia. 
        // El usuario transfiere tokens al SC
        //_transfer(msg.sender, address(this), _numTokens);   // Funcion del estandar ya que son ERC20

        // El SC envia los ethers al usuario
        //payable(msg.sender).transfer(precioTokens(_numTokens)); // Funcion de Solidity

    }

    // =====================
    // Gestion de la loteria
    // =====================

    // FUNCION: Compra de boletos de loteria
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
            
            // Crea un hash de los metadatos para registrar el boleto en GestorLoteria
            bytes32 metaHash = keccak256(abi.encodePacked(tipoActivo, activo, duracion));

            contractGanadores.registrarBoleto(metaHash, newTokenId, msg.sender);
        }
    }


    // FUNCION: Vemos que boletos tiene el usuario
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

    // FUNCION: Getter para obtener el precio del boleto
    function getPrecioBoleto() public view returns (uint) {
        return precioBoleto;
    }

    // FUNCION: Getter para obtener el precio del boleto
    function getPrecioToken() public view returns (uint256) {
        return precioToken;
    }

    // FUNCION: Enviamos los fondos al gestor de ganadores
    function enviarFondosAGestor(uint montoNecesario) public {
        ganadoresAdress.transfer(montoNecesario);
    }

}

