const GestorGanadores = artifacts.require("gestorGanadores");
const Loteria = artifacts.require("loteria");

contract('GestorGanadores', (accounts) => {
    let gestorGanadores;
    let loteria;
    const owner = accounts[0];
    const user = accounts[1];
    const user2 = accounts[2];
    const etherToSpend = web3.utils.toWei('10', 'ether');

    before(async () => {
        gestorGanadores = await GestorGanadores.new({ from: owner });
        loteria = await Loteria.new(gestorGanadores.address, { from: owner });
        await gestorGanadores.setLoteriaAddress(owner, loteria.address, { from: owner });
    });

    describe('Precomputación de loterías', function () {
        it('Calcula los hashes de todas las posibles loterias', async () => {
            const uniqueMetaHashes = await gestorGanadores.getUniqueMetaHashes();
            assert(uniqueMetaHashes.length == 48, 'No tiene en cuenta todas las combinaciones.')
        });
    });

    describe('Registro de boletos', function () {
        it('Registro de boletos', async () => {
            const metaHash = await gestorGanadores.getUniqueMetaHashes();
            const metaHashSample1 = metaHash[0];
            const metaHashSample2 = metaHash[1];
            // Owner coge 2 boletos de 2 loterias distintas
            await gestorGanadores.registrarBoleto(metaHashSample1, 1, owner, loteria.address, { from: owner });
            await gestorGanadores.registrarBoleto(metaHashSample1, 2, owner, loteria.address, { from: owner });
            await gestorGanadores.registrarBoleto(metaHashSample2, 3, owner, loteria.address, { from: owner });
            await gestorGanadores.registrarBoleto(metaHashSample2, 4, owner, loteria.address, { from: owner });

            // UserA coge lo mismo 
            await gestorGanadores.registrarBoleto(metaHashSample1, 5, user, loteria.address, { from: owner });
            await gestorGanadores.registrarBoleto(metaHashSample1, 6, user, loteria.address, { from: owner });
            await gestorGanadores.registrarBoleto(metaHashSample2, 7, user, loteria.address, { from: owner });
            await gestorGanadores.registrarBoleto(metaHashSample2, 8, user, loteria.address, { from: owner });

            const tickets1 = await gestorGanadores.boletosPorMetadatos(metaHashSample1, 0);
            assert.equal(tickets1, 1, 'No se registro bien el boleto ID: 1');

            const tickets2 = await gestorGanadores.boletosPorMetadatos(metaHashSample1, 1);
            assert.equal(tickets2, 2, 'No se registro bien el boleto ID: 2');

            const tickets3 = await gestorGanadores.boletosPorMetadatos(metaHashSample1, 2);
            assert.equal(tickets3, 5, 'No se registro bien el boleto ID: 5');

            const tickets4 = await gestorGanadores.boletosPorMetadatos(metaHashSample1, 3);
            assert.equal(tickets4, 6, 'No se registro bien el boleto ID: 6');
        });
    });

    describe('Flujo completo', function () {
        it('should handle the full lifecycle from token purchase to winner payout', async () => {
            // Paso 1: Compra de tokens ERC20
            await loteria.compraTokens(10, { from: user, value: etherToSpend });
            await loteria.compraTokens(10, { from: user2, value: etherToSpend });
            await loteria.compraTokens(10, { from: owner, value: etherToSpend });

            // Verificar el balance de tokens después de la compra
            let userTokens = await loteria.balanceTokens(user);
            assert.equal(userTokens.toNumber(), 10, 'El usuario debe tener 10 tokens después de la compra');

            // Paso 2: Compra de boletos
            await loteria.compraBoleto(2, "Acciones", "SAN", 1, "Subida", "0.10 - 0.15", { from: user });
            await loteria.compraBoleto(2, "Acciones", "SAN", 1, "Subida", "0.10 - 0.15", { from: user2 });
            await loteria.compraBoleto(2, "Acciones", "SAN", 1, "Subida", "0.10 - 0.15", { from: owner });

            // Verificar que los boletos fueron registrados
            let userTickets = await loteria.tusBoletos(user);
            assert.equal(userTickets.length, 2, 'El usuario debe tener 2 boletos después de la compra');
            
            //const metaHash = web3.utils.keccak256("Acciones", "SAN", 1);

            //const ticket = await gestorGanadores.boletosPorMetadatos(metaHash, 5);
            //assert.equal(ticket, 6, "No se almacena bien el boleto");

            //const balanceAntes = await web3.eth.getBalance(user);

            // Paso 3: Simulación de la generación de ganadores
            await gestorGanadores.generarGanador({ from: owner });
            
            //const balanceDespues = await web3.eth.getBalance(user);

            //assert(balanceDespues>balanceAntes, "No ha ido bien el pago");
        
        });
    });


    // describe('Pagos a ganadores', function() {
    //     it('debe pagar correctamente al ganador', async () => {
    //         const initialBalance = await web3.eth.getBalance(user);
    //         const metaHash = await gestorGanadores.getUniqueMetaHashes();
    //         const metaHashSample = metaHash[0];
    //         const amount = web3.utils.toWei('1', 'ether');

    //         await web3.eth.sendTransaction({from: owner, to: gestorGanadores.address, value: amount}); // Asegurarse de que el contrato tiene fondos.
    //         await gestorGanadores.realizarPago(user, amount, {from: owner});

    //         const finalBalance = await web3.eth.getBalance(user);
    //         assert(finalBalance > initialBalance, 'El balance del ganador debe haber aumentado.');
    //     });
    // });
});

