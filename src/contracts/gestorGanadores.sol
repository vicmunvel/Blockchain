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
    address public loteriaAddress;
    string[] private tiposActivo = ["Indice", "Acciones"];
    string[] private identificadoresActivo = ["IBEX35", "DAX30", "FTSE100", "SAN", "BBVA", "TEF"];
    uint[] private duraciones = [1, 2, 3, 4];
    bytes32[] public uniqueMetaHashes;

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
    function precomputarDetallesLoteria() private {
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

    // FUNCION: Getter para obtener los detalles de una loteria por su hash
    function getDetallesLoteria(bytes32 metaHash) public view returns (DetallesLoteria memory) {
        require(detallesPorMetaHash[metaHash].duracion != 0, "Loteria no registrada.");
        return detallesPorMetaHash[metaHash];
    }

    // FUNCION: Registramos los nuevos boletos en su loteria correspondiente
    function registrarBoleto(bytes32 metaHash, uint boletoId, address user) external {
        require(detallesPorMetaHash[metaHash].duracion != 0, "Loteria no registrada.");
        boletosPorMetadatos[metaHash].push(boletoId);
        direccionUsuarioBoleto[boletoId] = user;
    }

    // FUNCION: Generamos un ganador de forma aleatoria para cada loteria activa
    function generarGanador() public onlyOwner{
        loteria contractLoteria = loteria(loteriaAddress);
        require(uniqueMetaHashes.length > 0, "No hay loterias registradas.");

        uint precioBoleto = contractLoteria.getPrecioBoleto();
        uint precioToken = contractLoteria.getPrecioToken();

        for (uint i = 0; i < uniqueMetaHashes.length; i++) {
            bytes32 metaHash = uniqueMetaHashes[i];
            uint[] memory boletos = boletosPorMetadatos[metaHash];
            if (boletos.length > 0) {
                uint ganadorIndex = uint(keccak256(abi.encodePacked(block.timestamp, i))) % boletos.length;
                uint ganadorBoletoId = boletos[ganadorIndex];
                address direccionGanador = direccionUsuarioBoleto[ganadorBoletoId];
                uint montoGanado = boletos.length * precioBoleto * precioToken;

                ganadoresPorLoteria[metaHash] = Ganador({
                    boletoId: ganadorBoletoId,
                    direccion: direccionGanador,
                    metaHash: metaHash,
                    montoGanado: montoGanado
                });

                realizarPago(payable(direccionGanador), montoGanado);

                // Limpiamos los boletos para esa lotería
                delete boletosPorMetadatos[metaHash];
            }
        }
    }
    
    // FUNCION: La llamamos para realizar pagos
    function realizarPago(address payable ganador, uint monto) private {
        require(address(this).balance >= monto, "Fondos insuficientes");
        ganador.transfer(monto);
    }

    // FUNCION: Setter para establecer la dirección del Smart Contract "loteria.sol"
    function setLoteriaAddress(address _loteriaAddress) public{
        loteriaAddress = _loteriaAddress;
    }

    // FUNCION: Getter para obtener todos los metaHashes únicos
    function getUniqueMetaHashes() external view returns (bytes32[] memory) {
        return uniqueMetaHashes;
    }

    // FUNCION: Recogemos todos los ganadores de todas las loterias
    function getGanadoresConDetalles() public view returns (GanadorConDetalles[] memory) {
        uint validGanadoresCount = 0;

        // Primero contamos cuántos ganadores válidos existen
        for (uint i = 0; i < uniqueMetaHashes.length; i++) {
            if (ganadoresPorLoteria[uniqueMetaHashes[i]].boletoId != 0) {
                validGanadoresCount++;
            }
        }

        // Ahora, creamos un array solo con esos ganadores válidos
        GanadorConDetalles[] memory validGanadores = new GanadorConDetalles[](validGanadoresCount);
        uint j = 0;
        for (uint i = 0; i < uniqueMetaHashes.length; i++) {
            bytes32 metaHash = uniqueMetaHashes[i];
            if (ganadoresPorLoteria[metaHash].boletoId != 0) {
                Ganador memory ganador = ganadoresPorLoteria[metaHash];
                DetallesLoteria memory detalles = detallesPorMetaHash[metaHash];
                validGanadores[j++] = GanadorConDetalles({
                    boletoId: ganador.boletoId,
                    direccion: ganador.direccion,
                    montoGanado: ganador.montoGanado,
                    detallesLoteria: detalles
                });
            }
        }

        return validGanadores;
    }

}