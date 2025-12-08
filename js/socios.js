const API_BASE = '../api';

document.addEventListener('DOMContentLoaded', function () {
    const formSocio = document.getElementById('form-socio');
    const tbodySocios = document.getElementById('tbody-socios');

    const btnGuardar = document.querySelector('#form-socio button[type="submit"]');
    const btnNuevo = document.getElementById('btn-nuevo');
    const btnEliminar = document.getElementById('btn-eliminar');
    const btnModificar = document.getElementById('btn-modificar');

    const idSocio = document.getElementById('id_socio');
    const cedula = document.getElementById('cedula_socio');
    const nombre = document.getElementById('nombre_socio');
    const apellido1 = document.getElementById('apellido1_socio');
    const apellido2 = document.getElementById('apellido2_socio');
    const fecNacimiento = document.getElementById('fec_nacimiento');
    const fecIngreso = document.getElementById('fec_ingreso');
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

    let socios = [];
    let modoEdicion = false;

    async function leerRespuestaJSON(res, contexto) {
        const texto = await res.text();
        if (texto === '') return null;

        try {
            return JSON.parse(texto);
        } catch (e) {
            console.error(`RESPUESTA RAW DEL SERVIDOR (${contexto}):`, texto);
            throw new Error('El servidor devolvió algo que NO es JSON. Revisa la consola.');
        }
    }
    cargarDatosIniciales();
    cargarSocios();
    configurarEventos();

    async function cargarDatosIniciales() {
        await Promise.all([
            cargarTiposSocio(),
            cargarEstadosSocio(),
            cargarDistritos()
        ]);
    }

    function configurarEventos() {
        formSocio.addEventListener('submit', function (e) {
            e.preventDefault();
            guardarSocio();
        });

        btnNuevo.addEventListener('click', function () {
            limpiarFormulario();
            modoEdicion = false;
            actualizarEstadoBotones();
            formSocio.scrollIntoView({ behavior: 'smooth' });
        });

        btnEliminar.addEventListener('click', function () {
            if (!idSocio.value) return;
            if (confirm('Esta seguro de eliminar este socio?')) {
                eliminarSocio(idSocio.value);
            }
        });

        tbodySocios.addEventListener('click', function (e) {
            const tr = e.target.closest('tr');
            if (!tr) return;
            const id = tr.getAttribute('data-id');
            if (!id) return;
            editarSocio(id);
        });
    }

    // listar 
    async function cargarSocios() {
        try {
            const res = await fetch(`${API_BASE}/socios.php`);
            const data = await leerRespuestaJSON(res, 'cargarSocios');

            if (!res.ok) {
                const msg = data && (data.error || data.mensaje);
                throw new Error(msg || 'Error al cargar los socios');
            }

            socios = Array.isArray(data) ? data : [];
            mostrarSocios(socios);
        } catch (error) {
            console.error('Error:', error);
            mostrarAlerta(error.message || 'Error al cargar los socios', 'danger');
        }
    }

    function mostrarSocios(lista) {
        tbodySocios.innerHTML = '';
        lista.forEach(s => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', s.id_socio);
            tr.innerHTML = `
        <td>${s.id_socio}</td>
        <td>${s.cedula || ''}</td>
        <td>${s.nombre_completo || ''}</td>
        <td>${s.telefono || ''}</td>
        <td>${s.correo || ''}</td>
        <td>${s.tipo_socio || ''}</td>
        <td>${s.estado_socio || ''}</td>
        <td>${s.distrito || ''}, ${s.canton || ''}, ${s.provincia || ''}</td>
        <td>
          <button class="btn btn-sm btn-warning me-2" type="button" onclick="editarSocio(${s.id_socio})">Editar</button>
          <button class="btn btn-sm btn-danger" type="button" onclick="eliminarSocio(${s.id_socio})">Eliminar</button>
        </td>
      `;
            tbodySocios.appendChild(tr);
        });
    }

    function cargarSocioEnFormulario(socio) {
        idSocio.value = socio.id_socio || '';
        cedula.value = socio.cedula || '';
        nombre.value = socio.nombre || socio.nombre_socio || '';
        apellido1.value = socio.apellido1 || '';
        apellido2.value = socio.apellido2 || '';
        fecNacimiento.value = socio.fec_nacimiento || socio.fecha_nacimiento || '';
        if (fecIngreso) {
            fecIngreso.value = socio.fec_ingreso || socio.fecha_ingreso || '';
        }
        genero.value = socio.genero || '';
        estadoCivil.value = socio.estado_civil || '';
        profesion.value = socio.profesion || '';
        telefono1.value = socio.telefono1 || '';
        telefono2.value = socio.telefono2 || '';
        correo.value = socio.correo_electronico || socio.correo || '';
        idDistrito.value = socio.id_distrito || socio.cod_distrito || '';
        direccion.value = socio.direccion_exacta || socio.desc_direccion || '';
        idTipoSocio.value = socio.id_tipo_socio || socio.tipo_socio || '';
        idEstadoSocio.value = socio.id_estado_socio || socio.estado_socio || '';
    }

    function limpiarFormulario() {
        formSocio.reset();
        idSocio.value = '';
    }

    // crear / actualizar
    async function guardarSocio() {
        const socio = {
            cedula: cedula.value.trim(),
            nombre: nombre.value.trim(),
            apellido1: apellido1.value.trim(),
            apellido2: apellido2.value.trim(),
            fec_nacimiento: fecNacimiento.value,
            fec_ingreso: fecIngreso ? fecIngreso.value : null,
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

        if (!socio.nombre || !socio.telefono1 || !socio.id_distrito || !socio.id_tipo_socio || !socio.id_estado_socio) {
            mostrarAlerta('Complete los campos obligatorios (nombre, telefono, distrito, tipo y estado)', 'warning');
            return;
        }

        try {
            const url = idSocio.value ? `${API_BASE}/socios.php?id=${idSocio.value}` : `${API_BASE}/socios.php`;
            const method = idSocio.value ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(socio)
            });

            const data = await leerRespuestaJSON(res, 'guardarSocio');

            if (!res.ok || (data && data.ok === false)) {
                const msg = data && (data.error || data.mensaje);
                throw new Error(msg || 'Error al guardar el socio');
            }

            mostrarAlerta(`Socio ${idSocio.value ? 'actualizado' : 'creado'} correctamente`, 'success');
            limpiarFormulario();
            cargarSocios();
            modoEdicion = false;
            actualizarEstadoBotones();
        } catch (error) {
            console.error('Error:', error);
            mostrarAlerta(error.message || 'Error al guardar el socio', 'danger');
        }
    }

    //eliminar
    async function eliminarSocio(id) {
        if (!id) return;
        if (!confirm('Esta seguro de eliminar este socio?')) return;

        try {
            const res = await fetch(`${API_BASE}/socios.php?id=${id}`, { method: 'DELETE' });
            let data = null;

            // puede venir 204 sin body
            if (res.status !== 204) {
                data = await leerRespuestaJSON(res, 'eliminarSocio');
            }

            if (!res.ok) {
                const msg = data && (data.error || data.mensaje);
                throw new Error(msg || 'Error al eliminar el socio');
            }

            mostrarAlerta('Socio eliminado correctamente', 'success');
            if (String(id) === idSocio.value) {
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

    //combos
    async function cargarTiposSocio() {
        try {
            const res = await fetch(`${API_BASE}/tipos_socio.php`);
            const tipos = await leerRespuestaJSON(res, 'cargarTiposSocio');
            if (!res.ok) throw new Error('Error al cargar tipos de socio');

            idTipoSocio.innerHTML = '<option value="">Seleccione...</option>';
            (tipos || []).forEach(t => {
                const val = t.ID_TIPO_SOCIO || t.id_tipo_socio;
                const texto = t.NOMBRE_TIPO_SOCIO || t.nombre_tipo_socio || t.NOMBRE || t.nombre;
                if (!val) return;
                const option = document.createElement('option');
                option.value = val;
                option.textContent = texto || val;
                idTipoSocio.appendChild(option);
            });
        } catch (error) {
            console.error('Error:', error);
            mostrarAlerta('Error al cargar los tipos de socio', 'danger');
        }
    }

    async function cargarEstadosSocio() {
        try {
            const res = await fetch(`${API_BASE}/estados_socio.php`);
            const estados = await leerRespuestaJSON(res, 'cargarEstadosSocio');
            if (!res.ok) throw new Error('Error al cargar estados de socio');

            idEstadoSocio.innerHTML = '<option value="">Seleccione...</option>';
            (estados || []).forEach(e => {
                const val = e.ID_ESTADO_SOCIO || e.id_estado_socio;
                const texto = e.NOMBRE_ESTADO || e.nombre_estado || e.NOMBRE || e.nombre;
                if (!val) return;
                const option = document.createElement('option');
                option.value = val;
                option.textContent = texto || val;
                idEstadoSocio.appendChild(option);
            });
        } catch (error) {
            console.error('Error:', error);
            mostrarAlerta('Error al cargar los estados de socio', 'danger');
        }
    }

    async function cargarDistritos() {
        try {
            const res = await fetch(`${API_BASE}/distritos.php`);
            const distritos = await leerRespuestaJSON(res, 'cargarDistritos');
            if (!res.ok) throw new Error('Error al cargar distritos');

            idDistrito.innerHTML = '<option value="">Seleccione...</option>';
            (distritos || []).forEach(d => {
                const val = d.COD_DISTRITO || d.ID_DISTRITO || d.id_distrito;
                const nomDist = d.NOMBRE_DISTRITO || d.nombre_distrito || '';
                const nomCanton = d.NOMBRE_CANTON || d.nombre_canton || '';
                if (!val) return;
                const option = document.createElement('option');
                option.value = val;
                option.textContent = `${nomDist}${nomCanton ? ' - ' + nomCanton : ''}`;
                idDistrito.appendChild(option);
            });
        } catch (error) {
            console.error('Error:', error);
            mostrarAlerta('Error al cargar los distritos', 'danger');
        }
    }

    // botones / alertas
    function actualizarEstadoBotones() {
        const tieneId = !!idSocio.value;
        btnGuardar.textContent = tieneId ? 'Actualizar' : 'Guardar';
        btnModificar.disabled = !tieneId || modoEdicion;
        btnEliminar.disabled = !tieneId;
        btnNuevo.disabled = false;
    }

    function mostrarAlerta(mensaje, tipo) {
        const anterior = document.querySelector('.alert');
        if (anterior) anterior.remove();

        const alerta = document.createElement('div');
        alerta.className = `alert alert-${tipo} alert-dismissible fade show mt-3`;
        alerta.role = 'alert';
        alerta.innerHTML = `
      ${mensaje}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

        const container = document.querySelector('main');
        container.insertBefore(alerta, container.firstChild);

        setTimeout(() => {
            if (alerta.parentNode === container) alerta.remove();
        }, 5000);
    }

    // globales
    window.editarSocio = async function (id) {
        try {
            const res = await fetch(`${API_BASE}/socios.php?id=${id}`);
            const socio = await leerRespuestaJSON(res, 'editarSocio');
            if (!res.ok) throw new Error('Error al obtener datos del socio');

            cargarSocioEnFormulario(socio || {});
            modoEdicion = true;
            actualizarEstadoBotones();
            formSocio.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Error:', error);
            mostrarAlerta(error.message || 'No se pudo cargar el socio', 'danger');
        }
    };

    window.eliminarSocio = eliminarSocio;
});
