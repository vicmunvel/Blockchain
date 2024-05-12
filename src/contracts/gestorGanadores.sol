// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./loteria.sol";
import "./precomputar.sol";

contract gestorGanadores{

    // En este Smart Contract gestionamos el bote de las loterias
    receive() external payable {}

    // ESTRUCTURAS DE DATOS Y MAPPINGS
    struct DetallesLoteria {
        string tipoActivo;
        string identificadorActivo;
        uint duracion;
    }

    struct Ganador {
        uint boletoId;
        address direccion;
        bytes32 metaHash;
        uint montoGanado;
    }

    struct GanadorConDetalles {
        uint boletoId;
        address direccion;
        uint montoGanado;
        DetallesLoteria detallesLoteria;
    }

    mapping(bytes32 => DetallesLoteria) public detallesPorMetaHash;
    mapping(bytes32 => uint[]) public boletosPorMetadatos;
    mapping(uint => address) public direccionUsuarioBoleto;
    mapping(bytes32 => Ganador) public ganadoresPorLoteria;
    mapping(uint => bytes32) public apuestaLoto;
    mapping(bytes32 => bytes32) public apuestaExitosa;

    // VARIABLES
    address private owner;
    address private loteriaAddress;
    address private precomputarAddress;

    string[] private tiposActivo = ["Indice", "Acciones"];
    string[] private identificadoresActivo = ["IBEX35", "DAX30", "FTSE100", "SAN", "BBVA", "TEF"];
    uint[] private duraciones = [1, 2, 3, 4];
    bytes32[] private uniqueMetaHashes;
    uint private loteriaId = 1;
    uint public comisionOwner = 5;  // 5%

    // CONSTRUCTOR
    constructor() {
        owner = msg.sender; 
    }

    // MODIFICADORES
    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    // FUNCION: Registramos los nuevos boletos en su loteria correspondiente
    function registrarBoleto(bytes32 metaHash, bytes32 hashApuesta, uint boletoId, address user , address _loteriaAddress) external {
        require(loteriaAddress == _loteriaAddress, "No puede llamar a esta funcion");
        require(hashApuesta != 0, "Mal calculado hash de apuesta");

        bytes32 clave = keccak256(abi.encodePacked(metaHash, loteriaId));

        boletosPorMetadatos[clave].push(boletoId);
        direccionUsuarioBoleto[boletoId] = user;
        apuestaLoto[boletoId] = hashApuesta;
    }

    // FUNCION: Generamos un ganador de forma aleatoria para cada loteria activa
    function generarGanador() public onlyOwner returns(uint){

        require(precomputarAddress != address(0), "Direccion de Precomputar no establecida.");
        require(loteriaAddress != address(0), "Direccion de loteria no establecida.");

        loteria contractLoteria = loteria(loteriaAddress);
        precomputar contractPrecomputar = precomputar(precomputarAddress);
        uint length = contractPrecomputar.getUniqueMetaHashesCount();

        require(length > 0, "No hay loterias registradas.");

        uint precioBoleto = contractLoteria.getPrecioBoleto();
        uint precioToken = contractLoteria.getPrecioToken();
        uint montoFinalUser;
        uint montoFinalOwner;

        for (uint i = 0; i < length; i++) {
            bytes32 metaHash = contractPrecomputar.uniqueMetaHashes(i);
            bytes32 apuestaExitosaHash = contractPrecomputar.getApuestaExitosa(metaHash);
            bytes32 clave = keccak256(abi.encodePacked(metaHash, loteriaId));

            uint[] memory boletos = boletosPorMetadatos[clave];
            uint[] memory boletosValidos = new uint[](boletos.length);
            uint contadorValidos = 0;

            for (uint j = 0; j < boletos.length; j++) {
                if (apuestaLoto[boletos[j]] == apuestaExitosaHash) {
                    boletosValidos[contadorValidos++] = boletos[j];
                }
            }
            
            if (contadorValidos > 0) {
                    
                uint ganadorIndex = uint(keccak256(abi.encodePacked(block.timestamp, i))) % contadorValidos;
                uint ganadorBoletoId = boletosValidos[ganadorIndex];
                address direccionGanador = direccionUsuarioBoleto[ganadorBoletoId];
                uint montoGanado = boletos.length * precioBoleto * precioToken;

                ganadoresPorLoteria[clave] = Ganador({
                    boletoId: ganadorBoletoId,
                    direccion: direccionGanador,
                    metaHash: metaHash,
                    montoGanado: montoGanado
                });

                montoFinalUser = montoGanado * (100 - comisionOwner) / 100;
                montoFinalOwner = montoGanado * comisionOwner / 100;

                realizarPago(payable(direccionGanador), montoFinalUser);    // Pagamos al ganador
                realizarPago(payable(owner), montoFinalOwner);              // Recibimos la comision           
            
            } else{

                if(boletos.length > 0){
                    montoFinalUser = 0;
                    montoFinalOwner = boletos.length * precioBoleto * precioToken;
                    realizarPago(payable(owner), montoFinalOwner); 
                }
            }
        }

        loteriaId++;
        return montoFinalUser;
    }
    
    // FUNCION: La llamamos para realizar pagos
    function realizarPago(address payable ganador, uint monto) private {
        require(address(this).balance >= monto, "Fondos insuficientes");
        ganador.transfer(monto);
    }

    // FUNCION: Setter para establecer la dirección del Smart Contract "loteria.sol"
    function setLoteriaAddress(address _ownerAddress, address _loteriaAddress) public{
        require(owner == _ownerAddress, "Acceso restringido");
        loteriaAddress = _loteriaAddress;
    }

    function setPrecomputarAddress(address _ownerAddress, address _precomputarAddress) public{
        require(owner == _ownerAddress, "Acceso restringido");
        precomputarAddress = _precomputarAddress;
    }

    // FUNCION: Recogemos todos los ganadores de todas las loterias
    function getGanadoresConDetalles() public returns (GanadorConDetalles[] memory) {
        uint validGanadoresCount = 0;
        loteriaId--;

        precomputar contractPrecomputar = precomputar(precomputarAddress);
        uint metaHashesCount = contractPrecomputar.getUniqueMetaHashesCount();

        // Primero contamos cuántos ganadores válidos existen
        for (uint i = 0; i < metaHashesCount; i++) {
            bytes32 hashLoto = contractPrecomputar.uniqueMetaHashes(i);
            bytes32 clave = keccak256(abi.encodePacked(hashLoto, loteriaId));

            if (ganadoresPorLoteria[clave].boletoId != 0) {
                validGanadoresCount++;
            }
        }

        // Ahora, creamos un array solo con esos ganadores válidos
        GanadorConDetalles[] memory validGanadores = new GanadorConDetalles[](validGanadoresCount);
        uint j = 0;
        
        for (uint i = 0; i < metaHashesCount; i++) {
            bytes32 metaHash = contractPrecomputar.uniqueMetaHashes(i);
            bytes32 clave = keccak256(abi.encodePacked(metaHash, loteriaId));
            if (ganadoresPorLoteria[clave].boletoId != 0) {
                Ganador memory ganador = ganadoresPorLoteria[clave];

                precomputar.DetallesLoteria memory detallesPrecomputar = contractPrecomputar.getDetallesLoteria(metaHash);
                DetallesLoteria memory detalles = DetallesLoteria({
                    tipoActivo: detallesPrecomputar.tipoActivo,
                    identificadorActivo: detallesPrecomputar.identificadorActivo,
                    duracion: detallesPrecomputar.duracion
                });

                validGanadores[j++] = GanadorConDetalles({
                    boletoId: ganador.boletoId,
                    direccion: ganador.direccion,
                    montoGanado: ganador.montoGanado,
                    detallesLoteria: detalles
                });                
            }
        }
        loteriaId++;
        return validGanadores;
    }

}