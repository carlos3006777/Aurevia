const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();

// Permitir solicitudes desde el frontend publicado en Render
app.use(cors());
app.use(express.json());

// Conexión a Base de Datos en Render (usa DATABASE_URL si existe, o cae a local)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:carlos2006@localhost:5432/aurevia',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

app.get('/', (req, res) => {
    res.send('Servidor de Aurevia funcionando correctamente');
});

// OBTENER DESTINOS
app.get('/api/destinos', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM destinos');
        res.json(resultado.rows);
    } catch (error) {
        console.error('ERROR:', error.message);
        res.status(500).json({ error: 'Error al obtener destinos' });
    }
});

// OBTENER PAQUETES
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
        res.status(500).json({ error: 'Error al obtener paquetes' });
    }
});

// REGISTRO DE USUARIO
app.post('/api/registro', async (req, res) => {
    const { nombre, apellido, correo, telefono, contrasena, password } = req.body;
    const passFinal = contrasena || password;

    if (!nombre || !apellido || !correo || !passFinal) {
        return res.status(400).json({ mensaje: 'Por favor completa todos los campos obligatorios.' });
    }

    try {
        const query = `
            INSERT INTO usuarios (nombre, apellido, correo, telefono, contrasena)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, nombre, correo
        `;
        const resultado = await pool.query(query, [nombre, apellido, correo, telefono || null, passFinal]);

        res.status(201).json({ 
            mensaje: 'Usuario registrado correctamente',
            usuario: resultado.rows[0]
        });
    } catch (error) {
        console.error('ERROR:', error.message);

        // Error cuando el correo ya existe en la BD (llave duplicada en UNIQUE)
        if (error.code === '23505') {
            return res.status(400).json({ mensaje: 'El correo electrónico ya está registrado.' });
        }

        res.status(500).json({ error: error.message });
    }
});

// LOGIN DE USUARIO
app.post('/api/login', async (req, res) => {
    const { correo, contrasena, password } = req.body;
    const passFinal = contrasena || password;

    try {
        const resultado = await pool.query(
            'SELECT * FROM usuarios WHERE correo = $1 AND contrasena = $2',
            [correo, passFinal]
        );

        if (resultado.rows.length > 0) {
            res.status(200).json({ mensaje: 'Login exitoso', usuario: resultado.rows[0] });
        } else {
            // Verificar si el correo ni siquiera existe
            const existeUsuario = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
            if (existeUsuario.rows.length === 0) {
                return res.status(404).json({ mensaje: 'Usuario no encontrado' });
            }
            res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' });
        }
    } catch (error) {
        console.error('ERROR:', error.message);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

// FORMULARIO DE CONTACTO
app.post('/api/contacto', async (req, res) => {
    const { nombre, correo, telefono, destino_interes, mensaje } = req.body;
    try {
        await pool.query(
            `INSERT INTO contactos (nombre, correo, telefono, destino_interes, mensaje)
             VALUES ($1, $2, $3, $4, $5)`,
            [nombre, correo, telefono || null, destino_interes || null, mensaje]
        );
        res.status(201).json({ mensaje: 'Mensaje enviado correctamente' });
    } catch (error) {
        console.error('ERROR:', error.message);
        res.status(500).json({ error: 'Error al enviar el mensaje' });
    }
});

// Usar el puerto que asigna Render automáticamente
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

// ============================================
// NUEVOS ENDPOINTS: CRUD COMPLETO DE PAQUETES (Para Flutter/Web)
// ============================================

// CREAR PAQUETE (Ejecuta el Trigger de Auditoría en INSERT)
app.post('/api/paquetes', async (req, res) => {
    const { destino_id, nombre, hotel, transporte, alimentacion, precio } = req.body;
    try {
        const resultado = await pool.query(
            `INSERT INTO paquetes (destino_id, nombre, hotel, transporte, alimentacion, precio)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [destino_id, nombre, hotel, transporte, alimentacion, precio]
        );
        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error('ERROR:', error.message);
        res.status(500).json({ error: 'Error al crear paquete' });
    }
});

// ACTUALIZAR PAQUETE (Ejecuta el Trigger de Auditoría en UPDATE)
app.put('/api/paquetes/:id', async (req, res) => {
    const { id } = req.params;
    const { destino_id, nombre, hotel, transporte, alimentacion, precio } = req.body;
    try {
        const resultado = await pool.query(
            `UPDATE paquetes SET destino_id=$1, nombre=$2, hotel=$3, transporte=$4, alimentacion=$5, precio=$6
             WHERE id=$7 RETURNING *`,
            [destino_id, nombre, hotel, transporte, alimentacion, precio, id]
        );
        res.json(resultado.rows[0]);
    } catch (error) {
        console.error('ERROR:', error.message);
        res.status(500).json({ error: 'Error al actualizar paquete' });
    }
});

// ELIMINAR PAQUETE (Ejecuta el Trigger de Auditoría en DELETE)
app.delete('/api/paquetes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM paquetes WHERE id = $1', [id]);
        res.json({ mensaje: 'Paquete eliminado correctamente' });
    } catch (error) {
        console.error('ERROR:', error.message);
        res.status(500).json({ error: 'Error al eliminar paquete' });
    }
});

// ============================================
// CONSULTAR RESERVAS (MAESTRO-DETALLE) Y AUDITORÍA
// ============================================

// Obtener Reservas con datos del usuario y paquete (Usa Vista 2 con INNER JOIN)
app.get('/api/reservas', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM vista_reservas_detalladas');
        res.json(resultado.rows);
    } catch (error) {
        console.error('ERROR:', error.message);
        res.status(500).json({ error: 'Error al obtener reservas' });
    }
});

// Obtener logs del Trigger de Auditoría
app.get('/api/auditoria', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM auditoria ORDER BY fecha_hora DESC');
        res.json(resultado.rows);
    } catch (error) {
        console.error('ERROR:', error.message);
        res.status(500).json({ error: 'Error al consultar auditoría' });
    }
});