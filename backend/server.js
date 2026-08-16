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

// Auto-crear las columnas necesarias en la base de datos si no existen
pool.query(`
    ALTER TABLE paquetes ADD COLUMN IF NOT EXISTS destino_nombre VARCHAR(255);
    ALTER TABLE paquetes ADD COLUMN IF NOT EXISTS check_in BOOLEAN DEFAULT false;
    ALTER TABLE reservas ADD COLUMN IF NOT EXISTS monto_total NUMERIC(10,2);
`)
    .then(() => console.log('Estructura de la base de datos verificada correctamente.'))
    .catch(err => console.error('Error al verificar columnas:', err.message));

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
            SELECT 
                paquetes.*, 
                COALESCE(paquetes.destino_nombre, destinos.nombre, 'Sin destino') AS destino_nombre
            FROM paquetes
            LEFT JOIN destinos ON paquetes.destino_id = destinos.id
            ORDER BY paquetes.id DESC
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

// ============================================
// CREAR RESERVA (CON FALLBACK DE COLUMNAS MONTO_TOTAL / TOTAL)
// ============================================
app.post('/api/reservas', async (req, res) => {
    const { usuario_id, paquete_id, precio } = req.body;

    if (!paquete_id || !precio) {
        return res.status(400).json({ error: 'Faltan datos requeridos para la reserva' });
    }

    try {
        let clienteId = usuario_id || 1;

        // 1. Verificar si el usuario existe en la BD
        const usuarioExiste = await pool.query('SELECT id FROM usuarios WHERE id = $1', [clienteId]);
        
        // Si no existe el usuario (por ejemplo id = 1), creamos uno por defecto
        if (usuarioExiste.rows.length === 0) {
            const nuevoUsuario = await pool.query(`
                INSERT INTO usuarios (nombre, apellido, correo, contrasena) 
                VALUES ('Usuario', 'Invitado', 'invitado@aurevia.com', '123456') 
                RETURNING id
            `);
            clienteId = nuevoUsuario.rows[0].id;
        }

        // 2. Limpiar el formato del precio a número flotante
        const precioLimpio = parseFloat(String(precio).replace(/[^0-9.]/g, '')) || 0;

        // 3. Crear registro maestro en reservas (monto_total o total según tu BD)
        let reservaId;
        try {
            const nuevaReserva = await pool.query(
                'INSERT INTO reservas (usuario_id, monto_total) VALUES ($1, $2) RETURNING id',
                [clienteId, precioLimpio]
            );
            reservaId = nuevaReserva.rows[0].id;
        } catch (errCol) {
            const nuevaReserva = await pool.query(
                'INSERT INTO reservas (usuario_id, total) VALUES ($1, $2) RETURNING id',
                [clienteId, precioLimpio]
            );
            reservaId = nuevaReserva.rows[0].id;
        }

        // 4. Crear detalle de la reserva
        await pool.query(
            'INSERT INTO detalle_reserva (reserva_id, paquete_id) VALUES ($1, $2)',
            [reservaId, paquete_id]
        );

        res.status(201).json({ 
            mensaje: 'Reserva realizada con éxito', 
            reserva_id: reservaId 
        });
    } catch (error) {
        console.error('ERROR DETALLADO EN RESERVA:', error.message);
        res.status(500).json({ error: 'Error al procesar la reserva', detalle: error.message });
    }
});

// ============================================
// CRUD COMPLETO DE PAQUETES
// ============================================

// CREAR PAQUETE
app.post('/api/paquetes', async (req, res) => {
    const { destino_id, destino_nombre, destino, nombre, hotel, transporte, alimentacion, precio, check_in, checkIn } = req.body;
    const nombreDestinoFinal = destino_nombre || destino || null;
    const checkInFinal = check_in ?? checkIn ?? false;

    try {
        const resultado = await pool.query(
            `INSERT INTO paquetes (destino_id, destino_nombre, nombre, hotel, transporte, alimentacion, precio, check_in)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [destino_id || 1, nombreDestinoFinal, nombre, hotel, transporte, alimentacion, precio, checkInFinal]
        );
        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error('ERROR:', error.message);
        res.status(500).json({ error: 'Error al crear paquete' });
    }
});

// ACTUALIZAR PAQUETE
app.put('/api/paquetes/:id', async (req, res) => {
    const { id } = req.params;
    const { destino_id, destino_nombre, destino, nombre, hotel, transporte, alimentacion, precio, check_in, checkIn } = req.body;
    const nombreDestinoFinal = destino_nombre || destino || null;
    
    const checkInValor = (check_in !== undefined) ? check_in : ((checkIn !== undefined) ? checkIn : true);

    try {
        const resultado = await pool.query(
            `UPDATE paquetes 
             SET destino_id = COALESCE($1, destino_id), 
                 destino_nombre = COALESCE($2, destino_nombre), 
                 nombre = COALESCE($3, nombre), 
                 hotel = COALESCE($4, hotel), 
                 transporte = COALESCE($5, transporte), 
                 alimentacion = COALESCE($6, alimentacion), 
                 precio = COALESCE($7, precio), 
                 check_in = $8
             WHERE id = $9 RETURNING *`,
            [
                destino_id || null, 
                nombreDestinoFinal, 
                nombre || null, 
                hotel || null, 
                transporte || null, 
                alimentacion || null, 
                precio || null, 
                checkInValor, 
                id
            ]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({ error: 'Paquete no encontrado' });
        }

        res.json(resultado.rows[0]);
    } catch (error) {
        console.error('ERROR:', error.message);
        res.status(500).json({ error: 'Error al actualizar paquete' });
    }
});

// ELIMINAR PAQUETE
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
// CONSULTAR RESERVAS Y AUDITORÍA
// ============================================

app.get('/api/reservas', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM vista_reservas_detalladas');
        res.json(resultado.rows);
    } catch (error) {
        console.error('ERROR:', error.message);
        res.status(500).json({ error: 'Error al obtener reservas' });
    }
});

app.get('/api/auditoria', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM auditoria ORDER BY fecha_hora DESC');
        res.json(resultado.rows);
    } catch (error) {
        console.error('ERROR:', error.message);
        res.status(500).json({ error: 'Error al consultar auditoría' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});