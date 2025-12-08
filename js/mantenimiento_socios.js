const API_BASE = '../api';

const formSocio = document.getElementById('form-socio');
const tbodySocios = document.getElementById('tbody-socios');

const inputId = document.getElementById('id_socio');
const inputNombre = document.getElementById('nombre_socio');
const inputNumSocio = document.getElementById('numero_socio');
const inputFecNac = document.getElementById('fecha_nacimiento');
const inputFecIng = document.getElementById('fecha_ingreso');
const selectDistrito = document.getElementById('cod_distrito');
const inputDir = document.getElementById('desc_direccion');
const inputTel1 = document.getElementById('telefono1');
const inputTel2 = document.getElementById('telefono2');
const selectTipo = document.getElementById('tipo_socio');
const selectEstado = document.getElementById('estado_socio');
const btnGuardar = document.getElementById('btn-guardar');
const btnNuevo = document.getElementById('btn-nuevo');

document.addEventListener('DOMContentLoaded', () => {
    cargarDistritos();
    cargarSocios();
    formSocio.addEventListener('submit', guardarSocio);
    btnNuevo.addEventListener('click', () => {
        formSocio.reset();
        inputId.value = '';
        btnGuardar.textContent = 'Guardar socio';
        formSocio.scrollIntoView({ behavior: 'smooth' });
    });
});

// helper tipo socio
function textoTipoSocio(codigo) {
    if (codigo === 'R') return 'Regular';
    if (codigo === 'C') return 'Cachorro';
    if (codigo === 'H') return 'Honorario';
    if (codigo === 'B') return 'Benefactor';
    if (codigo === 'L') return 'Leo';
    return codigo || '';
}

// helper estado socio
function textoEstadoSocio(codigo) {
    if (codigo === 'A') return 'Activo';
    if (codigo === 'I') return 'Inactivo';
    if (codigo === 'N') return 'No pertenece';
    return codigo || '';
}

// validar telefonos (solo numeros, minimo 8, maximo 10)
function validarTelefono(valor, etiqueta) {
    if (!valor) return true;
    const soloNums = /^[0-9]+$/;
    if (!soloNums.test(valor)) {
        alert(`${etiqueta}: solo se permiten numeros`);
        return false;
    }
    if (valor.length < 8) {
        alert(`${etiqueta}: el numero debe tener minimo 8 digitos`);
        return false;
    }
    if (valor.length > 10) {
        alert(`${etiqueta}: el numero debe tener maximo 10 digitos`);
        return false;
    }
    return true;
}

// cargar distritos en el select
async function cargarDistritos() {
    try {
        const res = await fetch(`${API_BASE}/distritos.php`);
        if (!res.ok) throw new Error('Error al cargar distritos');

        const distritos = await res.json();
        selectDistrito.innerHTML = '<option value="">Seleccione...</option>';

        distritos.forEach(d => {
            const val = d.COD_DISTRITO || d.ID_DISTRITO || d.id_distrito;
            const nomDist = d.NOMBRE_DISTRITO || d.nombre_distrito || '';
            const nomCanton = d.NOMBRE_CANTON || d.nombre_canton || '';
            if (!val) return;
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = `${nomDist}${nomCanton ? ' - ' + nomCanton : ''}`;
            selectDistrito.appendChild(opt);
        });
    } catch (err) {
        console.error(err);
        alert('No se pudieron cargar los distritos');
    }
}

// listar socios
async function cargarSocios() {
    try {
        const res = await fetch(`${API_BASE}/socios.php`);
        if (!res.ok) throw new Error('Error al cargar socios');

        const socios = await res.json();
        tbodySocios.innerHTML = '';

        socios.forEach(s => {
            const id = s.ID_SOCIO;
            const nombre = s.NOMBRE_SOCIO;
            const numSocio = s.NUMERO_SOCIO;
            const tel1 = s.TELEFONO1;
            const tipo = s.TIPO_SOCIO;
            const estado = s.ESTADO_SOCIO;
            const distrito = s.NOMBRE_DISTRITO || '';
            const canton = s.NOMBRE_CANTON || '';
            const provincia = s.NOMBRE_PROVINCIA || '';

            const tr = document.createElement('tr');
            tr.innerHTML = `
        <td>${id}</td>
        <td>${nombre}</td>
        <td>${numSocio}</td>
        <td>${tel1}</td>
        <td>${textoTipoSocio(tipo)}</td>
        <td>${textoEstadoSocio(estado)}</td>
        <td>${distrito} ${canton ? ', ' + canton : ''} ${provincia ? ', ' + provincia : ''}</td>
        <td>
          <button class="btn btn-sm btn-amarillo btn-editar"
            data-id="${id}"
            data-nombre="${nombre}"
            data-numero="${numSocio}"
            data-fecnac="${s.FECHA_NACIMIENTO || ''}"
            data-fecing="${s.FECHA_INGRESO || ''}"
            data-distrito="${s.COD_DISTRITO || ''}"
            data-dir="${s.DESC_DIRECCION || ''}"
            data-tel1="${tel1}"
            data-tel2="${s.TELEFONO2 || ''}"
            data-tipo="${tipo}"
            data-estado="${estado}"
          >Editar</button>
          <button class="btn btn-sm btn-danger btn-eliminar" data-id="${id}">Eliminar</button>
        </td>
      `;
            tbodySocios.appendChild(tr);
        });

        asignarEventosAcciones();
    } catch (err) {
        console.error(err);
        alert('No se pudieron cargar los socios');
    }
}

// crear / actualizar
async function guardarSocio(e) {
    e.preventDefault();

    const id_socio = inputId.value.trim();
    const nombre_socio = inputNombre.value.trim();
    const numero_socio = inputNumSocio.value.trim();
    const fecha_nacimiento = inputFecNac.value || null;
    const fecha_ingreso = inputFecIng.value || null;
    const cod_distrito = selectDistrito.value;
    const desc_direccion = inputDir.value.trim() || null;
    const telefono1 = inputTel1.value.trim();
    const telefono2 = inputTel2.value.trim() || null;
    const tipo_socio = selectTipo.value;
    const estado_socio = selectEstado.value;

    if (!nombre_socio || !numero_socio || !fecha_ingreso || !cod_distrito || !telefono1 || !tipo_socio || !estado_socio) {
        alert('Complete los campos obligatorios');
        return;
    }

    if (!validarTelefono(telefono1, 'Telefono 1')) return;
    if (telefono2 && !validarTelefono(telefono2, 'Telefono 2')) return;

    const accion = id_socio ? 'actualizar' : 'crear';

    const payload = {
        accion,
        nombre_socio,
        fecha_nacimiento,
        fecha_ingreso,
        numero_socio,
        cod_distrito,
        desc_direccion,
        telefono1,
        telefono2,
        tipo_socio,
        estado_socio
    };

    if (id_socio) {
        payload.id_socio = id_socio;
    }

    try {
        const res = await fetch(`${API_BASE}/socios.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const respuesta = await res.json();
        if (!res.ok || respuesta.ok === false) {
            throw new Error(respuesta.mensaje || respuesta.error || 'Error al guardar socio');
        }

        alert(respuesta.mensaje || (id_socio ? 'Socio actualizado correctamente' : 'Socio creado correctamente'));

        formSocio.reset();
        inputId.value = '';
        btnGuardar.textContent = 'Guardar socio';
        cargarSocios();
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}

// editar / eliminar
function asignarEventosAcciones() {
    const botonesEditar = document.querySelectorAll('.btn-editar');
    botonesEditar.forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const nombre = btn.getAttribute('data-nombre');
            const numero = btn.getAttribute('data-numero');
            const fecnac = btn.getAttribute('data-fecnac');
            const fecing = btn.getAttribute('data-fecing');
            const distrito = btn.getAttribute('data-distrito');
            const dir = btn.getAttribute('data-dir');
            const tel1 = btn.getAttribute('data-tel1');
            const tel2 = btn.getAttribute('data-tel2');
            const tipo = btn.getAttribute('data-tipo');
            const estado = btn.getAttribute('data-estado');

            inputId.value = id;
            inputNombre.value = nombre;
            inputNumSocio.value = numero;
            inputFecNac.value = fecnac ? fecnac.substring(0, 10) : '';
            inputFecIng.value = fecing ? fecing.substring(0, 10) : '';
            selectDistrito.value = distrito || '';
            inputDir.value = dir || '';
            inputTel1.value = tel1 || '';
            inputTel2.value = tel2 || '';
            selectTipo.value = tipo || '';
            selectEstado.value = estado || '';

            btnGuardar.textContent = 'Actualizar socio';
            formSocio.scrollIntoView({ behavior: 'smooth' });
        });
    });

    const botonesEliminar = document.querySelectorAll('.btn-eliminar');
    botonesEliminar.forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            if (!confirm('Desea eliminar este socio?')) return;

            const payload = {
                accion: 'eliminar',
                id_socio: id
            };

            try {
                const res = await fetch(`${API_BASE}/socios.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const respuesta = await res.json();
                if (!res.ok || respuesta.ok === false) {
                    throw new Error(respuesta.mensaje || respuesta.error || 'Error al eliminar socio');
                }

                alert(respuesta.mensaje || 'Socio eliminado correctamente');
                cargarSocios();
            } catch (err) {
                console.error(err);
                alert(err.message);
            }
        });
    });
}
