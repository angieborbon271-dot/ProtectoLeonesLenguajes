// socios.js
document.addEventListener('DOMContentLoaded', function() {
    // Form elements
    const formSocio = document.getElementById('form-socio');
    const tbodySocios = document.getElementById('tbody-socios');
    const btnGuardar = document.querySelector('#form-socio button[type="submit"]');
    const btnNuevo = document.getElementById('btn-nuevo');
    const btnEliminar = document.getElementById('btn-eliminar');
    const btnModificar = document.getElementById('btn-modificar');
    
    // Form fields
    const idSocio = document.getElementById('id_socio');
    const cedula = document.getElementById('cedula_socio');
    const nombre = document.getElementById('nombre_socio');
    const apellido1 = document.getElementById('apellido1_socio');
    const apellido2 = document.getElementById('apellido2_socio');
    const fecNacimiento = document.getElementById('fec_nacimiento');
    const genero = document.getElementById('genero');
    const estadoCivil = document.getElementById('estado_civil');
    const profesion = document.getElementById('profesion');
    const telefono1 = document.getElementById('telefono1');
    const telefono2 = document.getElementById('telefono2');
    const correo = document.getElementById('correo_electronico');
    const idDistrito = document.getElementById('id_distrito');
    const direccion = document.getElementById('direccion_exacta');
    const idTipoSocio = document.getElementById('id_tipo_socio');
    const idEstadoSocio = document.getElementById('id_estado_socio');
    
    // Other variables
    let socios = [];
    let modoEdicion = false;

    // Initialize
    cargarDatosIniciales();
    cargarSocios();
    configurarEventos();

    // Load initial data
    async function cargarDatosIniciales() {
        await Promise.all([
            cargarTiposSocio(),
            cargarEstadosSocio(),
            cargarDistritos()
        ]);
    }

    // Event handlers
    function configurarEventos() {
        // Form submission
        formSocio.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarSocio();
        });

        // New button
        btnNuevo.addEventListener('click', function() {
            limpiarFormulario();
            modoEdicion = false;
            actualizarEstadoBotones();
            formSocio.scrollIntoView({ behavior: 'smooth' });
        });

        // Delete button
        btnEliminar.addEventListener('click', function() {
            if (confirm('¿Está seguro de eliminar este socio?')) {
                eliminarSocio(idSocio.value);
            }
        });

        // Table row click
        tbodySocios.addEventListener('click', function(e) {
            const tr = e.target.closest('tr');
            if (!tr) return;
            
            const id = tr.getAttribute('data-id');
            if (!id) return;
            
            const socio = socios.find(s => s.id_socio == id);
            if (socio) {
                cargarSocioEnFormulario(socio);
                modoEdicion = true;
                actualizarEstadoBotones();
            }
        });
    }

    // Load socios
    async function cargarSocios() {
        try {
            const response = await fetch('../socios.php');
            if (!response.ok) {
                throw new Error('Error al cargar los socios');
            }
            socios = await response.json();
            mostrarSocios(socios);
        } catch (error) {
            console.error('Error:', error);
            mostrarAlerta('Error al cargar los socios', 'danger');
        }
    }

    // Show socios in table
    function mostrarSocios(socios) {
        tbodySocios.innerHTML = '';
        socios.forEach(socio => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', socio.id_socio);
            tr.innerHTML = `
                <td>${socio.id_socio}</td>
                <td>${socio.cedula}</td>
                <td>${socio.nombre_completo}</td>
                <td>${socio.telefono}</td>
                <td>${socio.correo}</td>
                <td>${socio.tipo_socio}</td>
                <td>${socio.estado_socio}</td>
                <td>${socio.distrito}, ${socio.canton}, ${socio.provincia}</td>
                <td>
                    <button class="btn btn-sm btn-warning me-2" onclick="editarSocio(${socio.id_socio})">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarSocio(${socio.id_socio})">Eliminar</button>
                </td>
            `;
            tbodySocios.appendChild(tr);
        });
    }

    // Load socio data into form
    function cargarSocioEnFormulario(socio) {
        idSocio.value = socio.id_socio;
        cedula.value = socio.cedula;
        nombre.value = socio.nombre;
        apellido1.value = socio.apellido1;
        apellido2.value = socio.apellido2 || '';
        fecNacimiento.value = socio.fec_nacimiento || '';
        genero.value = socio.genero || '';
        estadoCivil.value = socio.estado_civil || '';
        profesion.value = socio.profesion || '';
        telefono1.value = socio.telefono1;
        telefono2.value = socio.telefono2 || '';
        correo.value = socio.correo_electronico;
        idDistrito.value = socio.id_distrito;
        direccion.value = socio.direccion_exacta;
        idTipoSocio.value = socio.id_tipo_socio;
        idEstadoSocio.value = socio.id_estado_socio;
    }

    // Clear form
    function limpiarFormulario() {
        formSocio.reset();
        idSocio.value = '';
    }

    // Save socio
    async function guardarSocio() {
        const socio = {
            cedula: cedula.value.trim(),
            nombre: nombre.value.trim(),
            apellido1: apellido1.value.trim(),
            apellido2: apellido2.value.trim(),
            fec_nacimiento: fecNacimiento.value,
            genero: genero.value,
            estado_civil: estadoCivil.value,
            profesion: profesion.value.trim(),
            telefono1: telefono1.value.trim(),
            telefono2: telefono2.value.trim(),
            correo_electronico: correo.value.trim(),
            id_distrito: idDistrito.value,
            direccion_exacta: direccion.value.trim(),
            id_tipo_socio: idTipoSocio.value,
            id_estado_socio: idEstadoSocio.value
        };

        // Basic validation
        if (!socio.cedula || !socio.nombre || !socio.apellido1 || !socio.telefono1 || 
            !socio.correo_electronico || !socio.id_distrito || !socio.direccion_exacta || 
            !socio.id_tipo_socio || !socio.id_estado_socio) {
            mostrarAlerta('Por favor complete todos los campos requeridos', 'warning');
            return;
        }

        try {
            const url = modoEdicion ? `../socios.php?id=${idSocio.value}` : '../socios.php';
            const method = modoEdicion ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(socio)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al guardar el socio');
            }

            mostrarAlerta(`Socio ${modoEdicion ? 'actualizado' : 'creado'} correctamente`, 'success');
            limpiarFormulario();
            cargarSocios();
            modoEdicion = false;
            actualizarEstadoBotones();
        } catch (error) {
            console.error('Error:', error);
            mostrarAlerta(error.message || 'Error al guardar el socio', 'danger');
        }
    }

    // Delete socio
    async function eliminarSocio(id) {
        if (!id) return;
        
        if (!confirm('¿Está seguro de eliminar este socio?')) {
            return;
        }

        try {
            const response = await fetch(`../socios.php?id=${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al eliminar el socio');
            }

            mostrarAlerta('Socio eliminado correctamente', 'success');
            if (id === idSocio.value) {
                limpiarFormulario();
                modoEdicion = false;
                actualizarEstadoBotones();
            }
            cargarSocios();
        } catch (error) {
            console.error('Error:', error);
            mostrarAlerta(error.message || 'Error al eliminar el socio', 'danger');
        }
    }

    // Load tipos de socio
    async function cargarTiposSocio() {
        try {
            const response = await fetch('../tipos_socio.php');
            if (!response.ok) {
                throw new Error('Error al cargar los tipos de socio');
            }
            const tipos = await response.json();
            
            idTipoSocio.innerHTML = '<option value="">Seleccione un tipo de socio...</option>';
            tipos.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo.id_tipo_socio;
                option.textContent = tipo.nombre_tipo_socio;
                idTipoSocio.appendChild(option);
            });
        } catch (error) {
            console.error('Error:', error);
            mostrarAlerta('Error al cargar los tipos de socio', 'danger');
        }
    }

    // Load estados de socio
    async function cargarEstadosSocio() {
        try {
            const response = await fetch('../estados_socio.php');
            if (!response.ok) {
                throw new Error('Error al cargar los estados de socio');
            }
            const estados = await response.json();
            
            idEstadoSocio.innerHTML = '<option value="">Seleccione un estado...</option>';
            estados.forEach(estado => {
                const option = document.createElement('option');
                option.value = estado.id_estado_socio;
                option.textContent = estado.nombre_estado;
                idEstadoSocio.appendChild(option);
            });
        } catch (error) {
            console.error('Error:', error);
            mostrarAlerta('Error al cargar los estados de socio', 'danger');
        }
    }

    // Load distritos
    async function cargarDistritos() {
        try {
            const response = await fetch('../distritos.php');
            if (!response.ok) {
                throw new Error('Error al cargar los distritos');
            }
            const distritos = await response.json();
            
            idDistrito.innerHTML = '<option value="">Seleccione un distrito...</option>';
            distritos.forEach(distrito => {
                const option = document.createElement('option');
                option.value = distrito.id_distrito;
                option.textContent = distrito.nombre_distrito;
                idDistrito.appendChild(option);
            });
        } catch (error) {
            console.error('Error:', error);
            mostrarAlerta('Error al cargar los distritos', 'danger');
        }
    }

    // Update button states
    function actualizarEstadoBotones() {
        const tieneId = !!idSocio.value;
        btnGuardar.textContent = modoEdicion ? 'Actualizar' : 'Guardar';
        btnModificar.disabled = !tieneId || modoEdicion;
        btnEliminar.disabled = !tieneId;
        btnNuevo.disabled = modoEdicion && !tieneId;
    }

    // Show alert
    function mostrarAlerta(mensaje, tipo) {
        // Remove previous alerts
        const alertaAnterior = document.querySelector('.alert');
        if (alertaAnterior) {
            alertaAnterior.remove();
        }

        const alerta = document.createElement('div');
        alerta.className = `alert alert-${tipo} alert-dismissible fade show mt-3`;
        alerta.role = 'alert';
        alerta.innerHTML = `
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        const container = document.querySelector('main');
        container.insertBefore(alerta, container.firstChild);
        
        // Remove alert after 5 seconds
        setTimeout(() => {
            if (alerta.parentNode === container) {
                alerta.remove();
            }
        }, 5000);
    }

    // Global functions
    window.editarSocio = function(id) {
        const socio = socios.find(s => s.id_socio == id);
        if (socio) {
            cargarSocioEnFormulario(socio);
            modoEdicion = true;
            actualizarEstadoBotones();
            formSocio.scrollIntoView({ behavior: 'smooth' });
        }
    };

    window.eliminarSocio = eliminarSocio;
});