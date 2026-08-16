const API_URL = 'https://aurevia-ye9a.onrender.com';

// REGISTRO DE USUARIO
const formRegistro = document.getElementById('formRegistro');
if (formRegistro) {
    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = document.getElementById('nombre')?.value;
        const apellido = document.getElementById('apellido')?.value;
        const correo = document.getElementById('correo')?.value;
        const telefono = document.getElementById('telefono')?.value;
        const contrasena = document.getElementById('contrasena')?.value;
        const confirmar = document.getElementById('confirmar')?.value;
        const mensaje = document.getElementById('mensaje');

        if (contrasena !== confirmar) {
            if (mensaje) {
                mensaje.textContent = 'Las contraseñas no coinciden';
                mensaje.style.color = 'red';
            }
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

            let errorTexto = '';
            try {
                const data = await respuesta.json();
                errorTexto = data.mensaje || data.error || data.detalle;
            } catch {
                errorTexto = await respuesta.text().catch(() => null);
            }

            if (respuesta.ok) {
                if (mensaje) {
                    mensaje.textContent = '¡Registro exitoso! Ahora puedes iniciar sesión.';
                    mensaje.style.color = 'green';
                }
                formRegistro.reset();
            } else {
                if (mensaje) {
                    mensaje.textContent = errorTexto || 'Error en el registro. Revisa los datos e intenta de nuevo.';
                    mensaje.style.color = 'red';
                }
            }
        } catch (error) {
            if (mensaje) {
                mensaje.textContent = 'No se pudo conectar con el servidor';
                mensaje.style.color = 'red';
            }
            console.error('Error en fetch registro:', error);
        }
    });
}

// LOGIN
const formLogin = document.getElementById('formLogin');
if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();

        const correo = document.getElementById('correo')?.value;
        const contrasena = document.getElementById('contrasena')?.value;
        const mensaje = document.getElementById('mensaje');

        try {
            const respuesta = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo, contrasena })
            });

            if (respuesta.ok) {
                if (mensaje) {
                    mensaje.textContent = 'Bienvenido/a a Aurevia';
                    mensaje.style.color = 'green';
                }
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1500);
            } else if (respuesta.status === 404) {
                if (mensaje) {
                    mensaje.innerHTML = 'Usuario no encontrado. <a href="sign_up.html" style="color: blue; text-decoration: underline;">Regístrate aquí</a>';
                    mensaje.style.color = 'red';
                }
            } else {
                if (mensaje) {
                    mensaje.textContent = 'Correo o contraseña incorrectos';
                    mensaje.style.color = 'red';
                }
            }
        } catch (error) {
            if (mensaje) {
                mensaje.textContent = 'No se pudo conectar con el servidor';
                mensaje.style.color = 'red';
            }
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
            console.error('Error al cargar destinos:', error);
        });
}

// MOSTRAR PAQUETES CON BOTÓN DE RESERVA
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
                        <p>${paquete.destino_nombre || ''}</p>
                        <p>🏨 ${paquete.hotel || ''}</p>
                        <p>✈️ ${paquete.transporte || ''}</p>
                        <p>🍽️ ${paquete.alimentacion || ''}</p>
                        <p class="destino-card-precio">$${paquete.precio}</p>
                        <button onclick="reservarPaquete(${paquete.id}, ${paquete.precio})" style="background-color: #007bff; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; margin-top: 10px;">
                            Reservar Ahora
                        </button>
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

// FUNCIÓN PARA PROCESAR RESERVAS DESDE EL FRONTEND
async function reservarPaquete(paqueteId, precio) {
    if (!confirm('¿Deseas confirmar la reserva de este paquete?')) return;

    try {
        const respuesta = await fetch(`${API_URL}/api/reservas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuario_id: 1,
                paquete_id: paqueteId,
                precio: precio
            })
        });

        const data = await respuesta.json().catch(() => null);

        if (respuesta.ok) {
            alert('¡Reserva realizada con éxito!');
        } else {
            // Muestra el mensaje de error exacto enviado por PostgreSQL / Node.js
            const msjError = data?.detalle || data?.error || 'Error en el servidor';
            alert(`Error al procesar reserva: ${msjError}`);
        }
    } catch (error) {
        console.error('Error en reservarPaquete:', error);
        alert('Error de conexión con el servidor.');
    }
}

// FORMULARIO DE CONTACTO
const formContacto = document.getElementById('formContacto');
if (formContacto) {
    formContacto.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = document.getElementById('nombre')?.value;
        const correo = document.getElementById('correo')?.value;
        const telefono = document.getElementById('telefono')?.value;
        const destino_interes = document.getElementById('destino_interes')?.value;
        const mensaje_texto = document.getElementById('mensaje_texto')?.value;
        const mensaje = document.getElementById('mensaje');

        try {
            const respuesta = await fetch(`${API_URL}/api/contacto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, correo, telefono, destino_interes, mensaje: mensaje_texto })
            });

            if (respuesta.ok) {
                if (mensaje) {
                    mensaje.textContent = 'Mensaje enviado correctamente, te contactaremos pronto';
                    mensaje.style.color = 'green';
                }
                formContacto.reset();
            } else {
                if (mensaje) {
                    mensaje.textContent = 'Error al enviar el mensaje, intenta de nuevo';
                    mensaje.style.color = 'red';
                }
            }
        } catch (error) {
            if (mensaje) {
                mensaje.textContent = 'No se pudo conectar con el servidor';
                mensaje.style.color = 'red';
            }
            console.error('Error en contacto:', error);
        }
    });
}

// MODAL Y CHECK-IN
function obtenerSelectPaquete() {
    return document.getElementById('paquete_select') || 
           document.getElementById('selectPaquete') || 
           document.getElementById('paqueteSelect');
}

async function abrirModalCheckin() {
    const modal = document.getElementById('modal-checkin') || document.getElementById('modalCheckIn');
    const selectPaquetes = obtenerSelectPaquete();

    if (modal) modal.style.display = 'block';

    if (selectPaquetes) {
        try {
            selectPaquetes.innerHTML = '<option value="" disabled selected>Cargando paquetes...</option>';

            const respuesta = await fetch(`${API_URL}/api/paquetes`);
            const paquetes = await respuesta.json();

            selectPaquetes.innerHTML = '<option value="" disabled selected>Selecciona tu Paquete</option>';

            paquetes.forEach(paquete => {
                const option = document.createElement('option');
                option.value = paquete.id;
                option.textContent = paquete.nombre;
                selectPaquetes.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar paquetes en el check-in:', error);
            selectPaquetes.innerHTML = '<option value="" disabled selected>Error al cargar la lista</option>';
        }
    }
}

function cerrarModalCheckin() {
    const modal = document.getElementById('modal-checkin') || document.getElementById('modalCheckIn');
    if (modal) modal.style.display = 'none';
}

async function procesarCheckin(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    const mensaje = document.getElementById('mensajeCheckin') || document.getElementById('mensaje');
    const selectPaquetes = obtenerSelectPaquete();

    if (!selectPaquetes || !selectPaquetes.value) {
        if (mensaje) {
            mensaje.textContent = 'Por favor selecciona un paquete válido';
            mensaje.style.color = 'red';
        }
        return;
    }

    const idPaqueteSeleccionado = selectPaquetes.value;

    if (mensaje) {
        mensaje.textContent = 'Procesando check-in...';
        mensaje.style.color = 'black';
    }

    try {
        const respuesta = await fetch(`${API_URL}/api/paquetes/${idPaqueteSeleccionado}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                check_in: true
            })
        });

        if (respuesta.ok) {
            if (mensaje) {
                mensaje.textContent = '¡Check-in realizado con éxito!';
                mensaje.style.color = 'green';
            }

            setTimeout(() => {
                const formCheckin = document.getElementById('formCheckin');
                if (formCheckin) formCheckin.reset();
                if (mensaje) mensaje.textContent = '';
                cerrarModalCheckin();
            }, 2000);
        } else {
            if (mensaje) {
                mensaje.textContent = 'Error al actualizar el check-in en el servidor';
                mensaje.style.color = 'red';
            }
        }
    } catch (error) {
        console.error('Error en procesarCheckin:', error);
        if (mensaje) {
            mensaje.textContent = 'Error de conexión con el servidor';
            mensaje.style.color = 'red';
        }
    }
}

// Vinculación limpia de eventos
const formCheckin = document.getElementById('formCheckin');
if (formCheckin) {
    formCheckin.addEventListener('submit', procesarCheckin);
}