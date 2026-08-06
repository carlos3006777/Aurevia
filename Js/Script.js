const API_URL = 'https://aurevia-ye9a.onrender.com';

// REGISTRO
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
                body: JSON.stringify({ nombre, apellido, correo, telefono, contrasena })
            });

            if (respuesta.ok) {
                mensaje.textContent = 'Registro exitoso, ahora puedes iniciar sesión';
                mensaje.style.color = 'green';
                formRegistro.reset();
            } else {
                mensaje.textContent = 'Error al registrar, intenta de nuevo';
                mensaje.style.color = 'red';
            }
        } catch (error) {
            mensaje.textContent = 'No se pudo conectar con el servidor';
            mensaje.style.color = 'red';
            console.error(error);
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
            } else {
                mensaje.textContent = 'Correo o contraseña incorrectos';
                mensaje.style.color = 'red';
            }
        } catch (error) {
            mensaje.textContent = 'No se pudo conectar con el servidor';
            mensaje.style.color = 'red';
            console.error(error);
        }
    });
}

// MOSTRAR DESTINOS
const destinosGrid = document.getElementById('destinosGrid');

if (destinosGrid) {
    fetch(`${API_URL}/api/destinos`)
        .then(respuesta => respuesta.json())
        .then(destinos => {
            destinos.forEach(destino => {
                const card = document.createElement('div');
                card.classList.add('destino-card');
                card.innerHTML = `
                    <img src="${destino.imagen}" alt="${destino.nombre}">
                    <div class="destino-card-info">
                        <h3>${destino.nombre}</h3>
                        <p>${destino.pais} · ${destino.duracion_dias} días</p>
                        <p class="destino-card-precio">Desde $${destino.precio_desde}</p>
                    </div>
                `;
                destinosGrid.appendChild(card);
            });
        })
        .catch(error => {
            console.error('Error al cargar destinos:', error);
            destinosGrid.innerHTML = '<p>No se pudieron cargar los destinos.</p>';
        });
}

// MOSTRAR PAQUETES
const paquetesGrid = document.getElementById('paquetesGrid');

if (paquetesGrid) {
    fetch(`${API_URL}/api/paquetes`)
        .then(respuesta => respuesta.json())
        .then(paquetes => {
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
            console.error(error);
        }
    });
}

// FAQ - MOSTRAR/OCULTAR RESPUESTAS
const preguntasFaq = document.querySelectorAll('.faq-pregunta');

preguntasFaq.forEach(pregunta => {
    pregunta.addEventListener('click', () => {
        const item = pregunta.parentElement;
        item.classList.toggle('activo');
    });
});