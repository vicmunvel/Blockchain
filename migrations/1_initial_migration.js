const GestorGanadores = artifacts.require("gestorGanadores");
const Loteria = artifacts.require("loteria");

module.exports = function(deployer) {
    deployer.deploy(GestorGanadores).then(function() {
        return deployer.deploy(Loteria, GestorGanadores.address);
    });
};

