const API_URL = 'https://aurevia-ye9a.onrender.com';

// REGISTRO DE USUARIO
const formRegistro = document.getElementById('formRegistro');
if (formRegistro) {
    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = document.getElementById('nombre').value;
        const apellido = document.getElementById('apellido').value;
        const correo = document.getElementById('correo').value;
        const telefono = document.getElementById('telefono').value;
        const contrasena = document.getElementById('contrasena').value;
        const confirmar = document.getElementById('confirmar').value;
        const mensaje = document.getElementById('mensaje');

        if (contrasena !== confirmar) {
            mensaje.textContent = 'Las contraseñas no coinciden';
            mensaje.style.color = 'red';
            return;
        }

        try {
            const respuesta = await fetch(`${API_URL}/api/registro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    nombre, 
                    apellido, 
                    correo, 
                    telefono, 
                    contrasena,
                    password: contrasena
                })
            });

            // Capturar la respuesta devuelta por el backend
            let errorTexto = '';
            try {
                const data = await respuesta.json();
                errorTexto = data.mensaje || data.error || data.detalle;
            } catch {
                errorTexto = await respuesta.text().catch(() => null);
            }

            if (respuesta.ok) {
                mensaje.textContent = '¡Registro exitoso! Ahora puedes iniciar sesión.';
                mensaje.style.color = 'green';
                formRegistro.reset();
            } else {
                mensaje.textContent = errorTexto || 'Error en el registro. Revisa los datos e intenta de nuevo.';
                mensaje.style.color = 'red';
            }
        } catch (error) {
            mensaje.textContent = 'No se pudo conectar con el servidor';
            mensaje.style.color = 'red';
            console.error('Error en fetch registro:', error);
        }
    });
}

// LOGIN
const formLogin = document.getElementById('formLogin');
if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();

        const correo = document.getElementById('correo').value;
        const contrasena = document.getElementById('contrasena').value;
        const mensaje = document.getElementById('mensaje');

        try {
            const respuesta = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo, contrasena })
            });

            if (respuesta.ok) {
                mensaje.textContent = 'Bienvenido/a a Aurevia';
                mensaje.style.color = 'green';
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1500);
            } else if (respuesta.status === 404) {
                mensaje.innerHTML = 'Usuario no encontrado. <a href="sign_up.html" style="color: blue; text-decoration: underline;">Regístrate aquí</a>';
                mensaje.style.color = 'red';
            } else {
                mensaje.textContent = 'Correo o contraseña incorrectos';
                mensaje.style.color = 'red';
            }
        } catch (error) {
            mensaje.textContent = 'No se pudo conectar con el servidor';
            mensaje.style.color = 'red';
            console.error('Error en fetch login:', error);
        }
    });
}

// MOSTRAR DESTINOS
const destinosGrid = document.getElementById('destinosGrid');
if (destinosGrid) {
    fetch(`${API_URL}/api/destinos`)
        .then(respuesta => respuesta.json())
        .then(destinos => {
            destinosGrid.innerHTML = "";
            destinos.forEach(destino => {
                destinosGrid.innerHTML += `
                    <div class="destino-card">
                        <img src="${destino.imagen}" alt="${destino.nombre}">
                        <div class="destino-info-basica">
                            <h3>${destino.nombre}</h3>
                            <p>${destino.pais} · ${destino.duracion_dias || destino.dias} días</p>
                            <span>Desde $${destino.precio_desde || destino.precio}</span>
                        </div>
                        <div class="destino-overlay">
                            <h3>${destino.nombre}</h3>
                            <p>${destino.descripcion || 'Disfruta de una experiencia inolvidable con tours guiados y hospedaje exclusivo.'}</p>
                        </div>
                    </div>
                `;
            });
        })
        .catch(error => {
            console.error('Error al cargar destinos de la API, cargando datos locales:', error);
            cargarDestinosLocales();
        });
}

function cargarDestinosLocales() {
    const destinosLocales = [
        { nombre: "París", pais: "Francia", dias: 7, precio: "899.00", imagen: "../img/paris.jpg", descripcion: "Conoce la Torre Eiffel, camina por el Sena y disfruta de la gastronomía francesa." },
        { nombre: "Maldivas", pais: "Maldivas", dias: 5, precio: "1299.00", imagen: "../img/maldivas.jpg", descripcion: "Relájate en villas sobre el agua y explora arrecifes de coral." },
        { nombre: "Kyoto", pais: "Japón", dias: 6, precio: "1099.00", imagen: "../img/kyoto.jpg", descripcion: "Camina entre templos milenarios, jardines zen y experimenta la cultura tradicional." },
        { nombre: "Cancún", pais: "México", dias: 5, precio: "650.00", imagen: "../img/cancun.jpg", descripcion: "Disfruta de playas de arena blanca, aguas turquesas y ruinas mayas." },
        { nombre: "Nueva York", pais: "Estados Unidos", dias: 6, precio: "1099.00", imagen: "../img/nuevayork.jpg", descripcion: "Recorre Times Square, pasea por Central Park y disfruta de la vida nocturna." },
        { nombre: "Cusco", pais: "Perú", dias: 7, precio: "799.00", imagen: "../img/cusco.jpg", descripcion: "Explora la cuna del imperio inca y visita la maravilla del mundo Machu Picchu." }
    ];

    destinosGrid.innerHTML = "";
    destinosLocales.forEach(destino => {
        destinosGrid.innerHTML += `
            <div class="destino-card">
                <img src="${destino.imagen}" alt="${destino.nombre}">
                <div class="destino-info-basica">
                    <h3>${destino.nombre}</h3>
                    <p>${destino.pais} · ${destino.dias} días</p>
                    <span>Desde $${destino.precio}</span>
                </div>
                <div class="destino-overlay">
                    <h3>${destino.nombre}</h3>
                    <p>${destino.descripcion}</p>
                </div>
            </div>
        `;
    });
}

// MOSTRAR PAQUETES EN LA PÁGINA
const paquetesGrid = document.getElementById('paquetesGrid');
if (paquetesGrid) {
    fetch(`${API_URL}/api/paquetes`)
        .then(respuesta => respuesta.json())
        .then(paquetes => {
            paquetesGrid.innerHTML = "";
            paquetes.forEach(paquete => {
                const card = document.createElement('div');
                card.classList.add('destino-card');
                card.innerHTML = `
                    <div class="destino-card-info">
                        <h3>${paquete.nombre}</h3>
                        <p>${paquete.destino_nombre}</p>
                        <p>🏨 ${paquete.hotel}</p>
                        <p>✈️ ${paquete.transporte}</p>
                        <p>🍽️ ${paquete.alimentacion}</p>
                        <p class="destino-card-precio">$${paquete.precio}</p>
                    </div>
                `;
                paquetesGrid.appendChild(card);
            });
        })
        .catch(error => {
            console.error('Error al cargar paquetes:', error);
            paquetesGrid.innerHTML = '<p>No se pudieron cargar los paquetes.</p>';
        });
}

// FORMULARIO DE CONTACTO
const formContacto = document.getElementById('formContacto');
if (formContacto) {
    formContacto.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = document.getElementById('nombre').value;
        const correo = document.getElementById('correo').value;
        const telefono = document.getElementById('telefono').value;
        const destino_interes = document.getElementById('destino_interes').value;
        const mensaje_texto = document.getElementById('mensaje_texto').value;
        const mensaje = document.getElementById('mensaje');

        try {
            const respuesta = await fetch(`${API_URL}/api/contacto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, correo, telefono, destino_interes, mensaje: mensaje_texto })
            });

            if (respuesta.ok) {
                mensaje.textContent = 'Mensaje enviado correctamente, te contactaremos pronto';
                mensaje.style.color = 'green';
                formContacto.reset();
            } else {
                mensaje.textContent = 'Error al enviar el mensaje, intenta de nuevo';
                mensaje.style.color = 'red';
            }
        } catch (error) {
            mensaje.textContent = 'No se pudo conectar con el servidor';
            mensaje.style.color = 'red';
            console.error('Error en contacto:', error);
        }
    });
}

// ACORDEÓN DE PREGUNTAS FRECUENTES (FAQ)
const preguntasFaq = document.querySelectorAll('.faq-pregunta');
preguntasFaq.forEach(pregunta => {
    pregunta.addEventListener('click', () => {
        const item = pregunta.parentElement;
        item.classList.toggle('activo');
    });
});

// FUNCIONES PARA EL MODAL DE CHECK-IN
async function abrirModalCheckin() {
    const modal = document.getElementById('modal-checkin');
    const selectPaquetes = document.getElementById('paquete_select');

    if (modal) modal.style.display = 'block';

    if (selectPaquetes) {
        try {
            selectPaquetes.innerHTML = '<option value="" disabled selected>Cargando paquetes...</option>';

            const respuesta = await fetch(`${API_URL}/api/paquetes`);
            const paquetes = await respuesta.json();

            selectPaquetes.innerHTML = '<option value="" disabled selected>Selecciona un paquete</option>';

            paquetes.forEach(paquete => {
                const option = document.createElement('option');
                option.value = paquete.id;
                option.textContent = paquete.nombre;
                // Guardamos el objeto entero en data-json para usarlo en la peticion PUT
                option.dataset.paquete = JSON.stringify(paquete);
                selectPaquetes.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar paquetes en el check-in:', error);
            selectPaquetes.innerHTML = '<option value="" disabled selected>Error al cargar la lista</option>';
        }
    }
}

function cerrarModalCheckin() {
    const modal = document.getElementById('modal-checkin');
    if (modal) modal.style.display = 'none';
}

async function procesarCheckin(e) {
    e.preventDefault();
    const mensaje = document.getElementById('mensajeCheckin');
    const selectPaquetes = document.getElementById('paquete_select');
    const codigo = document.getElementById('codigo_reserva').value;

    if (!selectPaquetes.value) {
        mensaje.textContent = 'Por favor selecciona un paquete';
        mensaje.style.color = 'red';
        return;
    }

    const opcionSeleccionada = selectPaquetes.options[selectPaquetes.selectedIndex];
    const paquete = JSON.parse(opcionSeleccionada.dataset.paquete);

    mensaje.textContent = 'Procesando check-in...';
    mensaje.style.color = 'black';

    try {
        const respuesta = await fetch(`${API_URL}/api/paquetes/${paquete.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...paquete,
                check_in: true
            })
        });

        if (respuesta.ok) {
            mensaje.textContent = `¡Check-in realizado con éxito para la reserva ${codigo}!`;
            mensaje.style.color = 'green';

            setTimeout(() => {
                document.getElementById('formCheckin').reset();
                mensaje.textContent = '';
                cerrarModalCheckin();
            }, 2500);
        } else {
            mensaje.textContent = 'Error al actualizar el check-in en el servidor';
            mensaje.style.color = 'red';
        }
    } catch (error) {
        console.error('Error en procesarCheckin:', error);
        mensaje.textContent = 'Error de conexión con el servidor';
        mensaje.style.color = 'red';
    }
}