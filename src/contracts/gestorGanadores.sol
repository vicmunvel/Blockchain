// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./loteria.sol";

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

    // VARIABLES
    address private owner;
    address private loteriaAddress;
    string[] private tiposActivo = ["Indice", "Acciones"];
    string[] private identificadoresActivo = ["IBEX35", "DAX30", "FTSE100", "SAN", "BBVA", "TEF"];
    uint[] private duraciones = [1, 2, 3, 4];
    bytes32[] private uniqueMetaHashes;
    uint private loteriaId = 1;
    uint public comisionOwner = 5;  // 5%

    // CONSTRUCTOR
    constructor() {
        precomputarDetallesLoteria();
        owner = msg.sender;
    }

    // MODIFICADORES
    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    // FUNCION: Calculamos los hashes de todas las posibles loterias
    function precomputarDetallesLoteria() internal {
        for (uint i = 0; i < tiposActivo.length; i++) {
            for (uint j = 0; j < identificadoresActivo.length; j++) {
                for (uint k = 0; k < duraciones.length; k++) {
                    // Generamos el hash para la combinación de loteria
                    bytes32 hash = keccak256(abi.encodePacked(tiposActivo[i], identificadoresActivo[j], duraciones[k]));
                    // Almacenamos el hash con los detalles en el mapping
                    detallesPorMetaHash[hash] = DetallesLoteria(tiposActivo[i], identificadoresActivo[j], duraciones[k]);
                    // Almacenamos el hash en un array de hashes unicos
                    uniqueMetaHashes.push(hash);
                }
            }
        }
    }

    // FUNCION: Registramos los nuevos boletos en su loteria correspondiente
    function registrarBoleto(bytes32 metaHash, uint boletoId, address user , address _loteriaAddress) external {
        require(loteriaAddress == _loteriaAddress, "No puede llamar a esta funcion");
        require(detallesPorMetaHash[metaHash].duracion != 0, "Loteria no registrada.");
        
        bytes32 clave = keccak256(abi.encodePacked(metaHash, loteriaId));

        boletosPorMetadatos[clave].push(boletoId);
        direccionUsuarioBoleto[boletoId] = user;
    }

    // FUNCION: Generamos un ganador de forma aleatoria para cada loteria activa
    function generarGanador() public onlyOwner returns(uint){

        loteria contractLoteria = loteria(loteriaAddress);
        require(uniqueMetaHashes.length > 0, "No hay loterias registradas.");

        uint precioBoleto = contractLoteria.getPrecioBoleto();
        uint precioToken = contractLoteria.getPrecioToken();
        uint montoFinalUser;
        uint montoFinalOwner;
        for (uint i = 0; i < uniqueMetaHashes.length; i++) {
            bytes32 metaHash = uniqueMetaHashes[i];
            bytes32 clave = keccak256(abi.encodePacked(metaHash, loteriaId));

            uint[] memory boletos = boletosPorMetadatos[clave];
            
            if (boletos.length > 0) {
                
                uint ganadorIndex = uint(keccak256(abi.encodePacked(block.timestamp, i))) % boletos.length;
                uint ganadorBoletoId = boletos[ganadorIndex];
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

    // FUNCION: Recogemos todos los ganadores de todas las loterias
    function getGanadoresConDetalles() public returns (GanadorConDetalles[] memory) {
        uint validGanadoresCount = 0;
        loteriaId--;

        // Primero contamos cuántos ganadores válidos existen
        for (uint i = 0; i < uniqueMetaHashes.length; i++) {

            bytes32 clave = keccak256(abi.encodePacked(uniqueMetaHashes[i], loteriaId));

            if (ganadoresPorLoteria[clave].boletoId != 0) {
                validGanadoresCount++;
            }
        }

        // Ahora, creamos un array solo con esos ganadores válidos
        GanadorConDetalles[] memory validGanadores = new GanadorConDetalles[](validGanadoresCount);
        uint j = 0;
        for (uint i = 0; i < uniqueMetaHashes.length; i++) {
            bytes32 metaHash = uniqueMetaHashes[i];
            bytes32 clave = keccak256(abi.encodePacked(metaHash, loteriaId));
            if (ganadoresPorLoteria[clave].boletoId != 0) {
                Ganador memory ganador = ganadoresPorLoteria[clave];
                DetallesLoteria memory detalles = detallesPorMetaHash[metaHash];
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