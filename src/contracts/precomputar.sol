// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./gestorGanadores.sol";

contract precomputar {

    // ESTRUCTURA DE DATOS
    struct DetallesLoteria {
        string tipoActivo;
        string identificadorActivo;
        uint duracion;
    }

    // VARIABLES GLOBALES PREDEFINIDAS
    address public owner;

    string[] private tiposActivo = ["Indice", "Acciones"];
    string[] private identificadoresActivo = ["IBEX35", "DAX30", "FTSE100", "SAN", "BBVA", "TEF"];
    uint[] private duraciones = [1, 2, 3, 4];
    bytes32[] public uniqueMetaHashes;

    mapping(bytes32 => DetallesLoteria) public detallesPorMetaHash;
    mapping(bytes32 => bytes32) public apuestaExitosa;

    gestorGanadores public contractGanadores;

    // CONSTRUCTOR
    constructor(address payable _gestorGanadoresAddress) {
        owner = msg.sender;
        precomputarDetallesLoteria();
        contractGanadores = gestorGanadores(_gestorGanadoresAddress);
        contractGanadores.setPrecomputarAddress(owner, address(this));
    }

    // FUNCION: Calculamos los hashes de todas las posibles loterias
    function precomputarDetallesLoteria() internal {
        for (uint i = 0; i < tiposActivo.length; i++) {
            for (uint j = 0; j < identificadoresActivo.length; j++) {
                for (uint k = 0; k < duraciones.length; k++) {
                    bytes32 hash = keccak256(abi.encodePacked(tiposActivo[i], identificadoresActivo[j], duraciones[k]));
                    detallesPorMetaHash[hash] = DetallesLoteria(tiposActivo[i], identificadoresActivo[j], duraciones[k]);
                    uniqueMetaHashes.push(hash);
                    apuestaExitosa[hash] = keccak256(abi.encodePacked("Subida", "0.25 - 0.30"));
                }
            }
        }

    }

    // FUNCIONES DE ACCESO
    function getDetallesLoteria(bytes32 hash) public view returns (DetallesLoteria memory) {
        return detallesPorMetaHash[hash];
    }

    function getApuestaExitosa(bytes32 hash) public view returns (bytes32) {
        return apuestaExitosa[hash];
    }

    function getUniqueMetaHashesCount() public view returns (uint) {
        return uniqueMetaHashes.length;
    }
}
