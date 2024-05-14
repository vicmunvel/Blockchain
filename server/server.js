const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

app.post('/register', async (req, res) => {
    const { nombre, apellidos, correo, telefono, password } = req.body;

    try {
        const filePath = path.join(__dirname, 'users.json');
        let users = [];
        if (fs.existsSync(filePath)) {
            users = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }

        // Verificar si el correo ya está registrado
        const userExists = users.some(user => bcrypt.compareSync(correo, user.correo));
        if (userExists) {
            return res.status(400).send({ message: 'El correo ya está registrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const encryptedNombre = await bcrypt.hash(nombre, 10);
        const encryptedApellidos = await bcrypt.hash(apellidos, 10);
        const encryptedCorreo = await bcrypt.hash(correo, 10); 
        const encryptedTelefono = await bcrypt.hash(telefono, 10);
        const newUser = { nombre: encryptedNombre, apellidos: encryptedApellidos, correo: encryptedCorreo, telefono: encryptedTelefono, password: hashedPassword };

        users.push(newUser);
        fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
        
        res.send({ message: 'Datos guardados correctamente' });
    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        res.status(500).send('Error al registrar el usuario');
    }
});


app.post('/login', async (req, res) => {
    const { correo, password } = req.body;

    try {
        const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8'));
        const user = users.find(user => {
            return bcrypt.compareSync(correo, user.correo) && bcrypt.compareSync(password, user.password);
        });

        if (user) {
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).send('Error al iniciar sesión');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
