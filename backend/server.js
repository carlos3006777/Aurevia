const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

//Conexion Backend (Noje.js) - BDD
const pool = new Pool({
    user: 'postgres',
    password: 'carlos2006',
    host: 'localhost',
    port: 5432,
    database: 'aurevia'
});

app.get('/', (req, res) => {
    res.send('Servidor de Aurevia funcionando correctamente');
});

app.get('/api/destinos', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM destinos');
        res.json(resultado.rows);
    } catch (error) {
        console.error('ERROR:', error.message);
        res.status(500).send('Error al obtener destinos');
    }
});
   
app.get('/api/paquetes', async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT paquetes.*, destinos.nombre AS destino_nombre
            FROM paquetes
            JOIN destinos ON paquetes.destino_id = destinos.id
        `);
        res.json(resultado.rows);
    } catch (error) {
        console.error('ERROR:', error.message);
        res.status(500).send('Error al obtener paquetes');
    }
});

app.post('/api/registro', async (req, res) => {
    const { nombre, apellido, correo, telefono, contrasena } = req.body;
    try {
        await pool.query(
            `INSERT INTO usuarios (nombre, apellido, correo, telefono, contrasena)
             VALUES ($1, $2, $3, $4, $5)`,
            [nombre, apellido, correo, telefono, contrasena]
        );
        res.status(201).send('Usuario registrado correctamente');
    } catch (error) {
        console.error('ERROR:', error.message);
        res.status(500).send('Error al registrar usuario');
    }
});

app.post('/api/login', async (req, res) => {
    const { correo, contrasena } = req.body;
    try {
        const resultado = await pool.query(
            'SELECT * FROM usuarios WHERE correo = $1 AND contrasena = $2',
            [correo, contrasena]
        );
        if (resultado.rows.length > 0) {
            res.status(200).send('Login exitoso');
        } else {
            res.status(401).send('Correo o contraseña incorrectos');
        }
    } catch (error) {
        console.error('ERROR:', error.message);
        res.status(500).send('Error al iniciar sesión');
    }
});

app.post('/api/contacto', async (req, res) => {
    const { nombre, correo, telefono, destino_interes, mensaje } = req.body;
    try {
        await pool.query(
            `INSERT INTO contactos (nombre, correo, telefono, destino_interes, mensaje)
             VALUES ($1, $2, $3, $4, $5)`,
            [nombre, correo, telefono, destino_interes, mensaje]
        );
        res.status(201).send('Mensaje enviado correctamente');
    } catch (error) {
        console.error('ERROR:', error.message);
        res.status(500).send('Error al enviar el mensaje');
    }
});

// El servidor se ejecuta en localhost (esta computadora), puerto 3000
app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});