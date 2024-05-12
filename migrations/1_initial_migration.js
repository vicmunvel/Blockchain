const GestorGanadores = artifacts.require("gestorGanadores");
const Loteria = artifacts.require("loteria");
const Precomputo = artifacts.require("precomputar");

module.exports = function(deployer) {
    deployer.deploy(GestorGanadores).then(function() {
        return deployer.deploy(Precomputo, GestorGanadores.address)
        .then(function() {
            return deployer.deploy(Loteria, GestorGanadores.address);
        });
    });
};
