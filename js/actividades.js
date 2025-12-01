// Variables globales
let actividades = [];
let modoEdicion = false;
let actividadActualId = null;

// Elementos del DOM
const formActividad = document.getElementById('form-actividad');
const tablaActividades = document.getElementById('tabla-actividades');
const btnNuevo = document.getElementById('btn-nuevo');
const btnGuardar = document.getElementById('btn-guardar');
const btnCancelar = document.getElementById('btn-cancelar');
const btnEliminar = document.getElementById('btn-eliminar');

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    cargarActividades();
    cargarTiposActividad();
    cargarSocios();
    
    // Configurar la fecha actual como valor por defecto
    document.getElementById('fec_actividad').valueAsDate = new Date();
    
    // Eventos de los botones
    btnNuevo.addEventListener('click', prepararNuevaActividad);
    btnGuardar.addEventListener('click', guardarActividad);
    btnCancelar.addEventListener('click', cancelarEdicion);
    btnEliminar.addEventListener('click', confirmarEliminarActividad);
    
    // Inicializar tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

// Cargar la lista de actividades
async function cargarActividades() {
    try {
        const response = await fetch('actividades.php');
        if (!response.ok) throw new Error('Error al cargar las actividades');
        
        actividades = await response.json();
        mostrarActividades(actividades);
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al cargar las actividades: ' + error.message, 'danger');
    }
}

// Cargar tipos de actividad para el select
async function cargarTiposActividad() {
    try {
        const response = await fetch('tipos_actividad.php');
        if (!response.ok) throw new Error('Error al cargar los tipos de actividad');
        
        const tipos = await response.json();
        const select = document.getElementById('id_tipo_actividad');
        
        // Limpiar opciones existentes excepto la primera
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Agregar opciones
        tipos.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo.ID_TIPO_ACTIVIDAD;
            option.textContent = tipo.NOMBRE;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al cargar los tipos de actividad', 'warning');
    }
}

// Cargar socios para el select de responsable
async function cargarSocios() {
    try {
        const response = await fetch('socios.php?activos=1');
        if (!response.ok) throw new Error('Error al cargar los socios');
        
        const socios = await response.json();
        const select = document.getElementById('id_socio_responsable');
        
        // Limpiar opciones existentes excepto la primera
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Agregar opciones
        socios.forEach(socio => {
            const nombreCompleto = `${socio.NOMBRE} ${socio.APELLIDO1} ${socio.APELLIDO2 || ''}`.trim();
            const option = document.createElement('option');
            option.value = socio.ID_SOCIO;
            option.textContent = nombreCompleto;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al cargar la lista de socios', 'warning');
    }
}

// Mostrar actividades en la tabla
function mostrarActividades(actividades) {
    const tbody = document.querySelector('#tabla-actividades tbody');
    tbody.innerHTML = '';
    
    if (actividades.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="7" class="text-center">No hay actividades registradas</td>';
        tbody.appendChild(tr);
        return;
    }
    
    actividades.forEach(actividad => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${actividad.ID_ACTIVIDAD}</td>
            <td>${formatearFecha(actividad.FEC_ACTIVIDAD)}</td>
            <td>${actividad.NOMBRE}</td>
            <td>${actividad.TIPO_ACTIVIDAD || 'No especificado'}</td>
            <td>${actividad.NOMBRE_RESPONSABLE || 'No asignado'}</td>
            <td class="text-nowrap">
                <button class="btn btn-sm btn-outline-primary btn-editar" data-id="${actividad.ID_ACTIVIDAD}" 
                        data-bs-toggle="tooltip" title="Editar actividad">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${actividad.ID_ACTIVIDAD}" 
                        data-bs-toggle="tooltip" title="Eliminar actividad">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Agregar event listeners a los botones
    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', () => cargarActividad(btn.dataset.id));
    });
    
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', () => confirmarEliminarActividad(btn.dataset.id));
    });
    
    // Inicializar tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Cargar datos de una actividad para edición
async function cargarActividad(id) {
    try {
        const response = await fetch(`actividades.php?id=${id}`);
        if (!response.ok) throw new Error('Error al cargar la actividad');
        
        const actividad = await response.json();
        
        // Llenar el formulario con los datos de la actividad
        document.getElementById('id_actividad').value = actividad.ID_ACTIVIDAD;
        document.getElementById('nombre_actividad').value = actividad.NOMBRE;
        document.getElementById('id_tipo_actividad').value = actividad.ID_TIPO_ACTIVIDAD;
        document.getElementById('fec_actividad').value = actividad.FEC_ACTIVIDAD.split(' ')[0]; // Solo la fecha, sin la hora
        document.getElementById('id_socio_responsable').value = actividad.ID_SOCIO_RESPONSABLE || '';
        document.getElementById('objetivo_actividad').value = actividad.OBJETIVO || '';
        
        // Cambiar al modo edición
        modoEdicion = true;
        actividadActualId = id;
        actualizarUI();
        
        // Hacer scroll al formulario
        document.getElementById('form-actividad').scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al cargar la actividad: ' + error.message, 'danger');
    }
}

// Guardar o actualizar una actividad
async function guardarActividad() {
    // Validar campos requeridos
    const nombre = document.getElementById('nombre_actividad').value.trim();
    const idTipoActividad = document.getElementById('id_tipo_actividad').value;
    const fecha = document.getElementById('fec_actividad').value;
    
    if (!nombre || !idTipoActividad || !fecha) {
        mostrarAlerta('Por favor complete todos los campos requeridos', 'warning');
        return;
    }
    
    const actividad = {
        nombre: nombre,
        id_tipo_actividad: idTipoActividad,
        fec_actividad: fecha,
        id_socio_responsable: document.getElementById('id_socio_responsable').value || null,
        objetivo: document.getElementById('objetivo_actividad').value.trim()
    };
    
    try {
        let response;
        let method;
        let url = 'actividades.php';
        
        if (modoEdicion && actividadActualId) {
            // Actualizar actividad existente
            method = 'PUT';
            url += `?id=${actividadActualId}`;
        } else {
            // Crear nueva actividad
            method = 'POST';
        }
        
        response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(actividad)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error al guardar la actividad');
        }
        
        // Mostrar mensaje de éxito
        mostrarAlerta(
            modoEdicion ? 'Actividad actualizada correctamente' : 'Actividad creada correctamente',
            'success'
        );
        
        // Recargar la lista de actividades
        await cargarActividades();
        
        // Limpiar el formulario
        limpiarFormulario();
        
        // Si es una nueva actividad, hacer scroll a la tabla
        if (!modoEdicion) {
            document.getElementById('tabla-actividades').scrollIntoView({ behavior: 'smooth' });
        }
        
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al guardar la actividad: ' + error.message, 'danger');
    }
}

// Confirmar eliminación de una actividad
function confirmarEliminarActividad(id = null) {
    const idActividad = id || actividadActualId;
    if (!idActividad) return;
    
    // Buscar la actividad en el array
    const actividad = actividades.find(a => a.ID_ACTIVIDAD == idActividad);
    if (!actividad) return;
    
    if (confirm(`¿Está seguro que desea eliminar la actividad "${actividad.NOMBRE}"?`)) {
        eliminarActividad(idActividad);
    }
}

// Eliminar una actividad
async function eliminarActividad(id) {
    try {
        const response = await fetch(`actividades.php?id=${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error al eliminar la actividad');
        }
        
        // Mostrar mensaje de éxito
        mostrarAlerta('Actividad eliminada correctamente', 'success');
        
        // Recargar la lista de actividades
        await cargarActividades();
        
        // Si estábamos editando la actividad eliminada, limpiar el formulario
        if (modoEdicion && actividadActualId == id) {
            limpiarFormulario();
        }
        
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error al eliminar la actividad: ' + error.message, 'danger');
    }
}

// Preparar formulario para nueva actividad
function prepararNuevaActividad() {
    modoEdicion = false;
    actividadActualId = null;
    limpiarFormulario();
    document.getElementById('form-actividad').scrollIntoView({ behavior: 'smooth' });
}

// Limpiar el formulario
function limpiarFormulario() {
    formActividad.reset();
    document.getElementById('id_actividad').value = '';
    document.getElementById('fec_actividad').valueAsDate = new Date();
    modoEdicion = false;
    actividadActualId = null;
    actualizarUI();
}

// Cancelar edición
function cancelarEdicion() {
    limpiarFormulario();
    document.getElementById('tabla-actividades').scrollIntoView({ behavior: 'smooth' });
}

// Actualizar la interfaz de usuario según el modo
function actualizarUI() {
    // Actualizar botones
    btnGuardar.textContent = modoEdicion ? 'Actualizar Actividad' : 'Guardar Nueva Actividad';
    btnEliminar.style.display = modoEdicion ? 'inline-block' : 'none';
    btnCancelar.style.display = 'inline-block';
    
    // Actualizar título del formulario
    document.querySelector('.card-header h5').textContent = 
        modoEdicion ? 'Editar Actividad' : 'Nueva Actividad';
    
    // Habilitar/deshabilitar campos según sea necesario
    const campos = formActividad.querySelectorAll('input, select, textarea');
    campos.forEach(campo => {
        campo.disabled = false;
    });
}

// Mostrar alerta
function mostrarAlerta(mensaje, tipo = 'info') {
    // Eliminar alertas anteriores
    const alertaAnterior = document.querySelector('.alert');
    if (alertaAnterior) {
        alertaAnterior.remove();
    }
    
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} alert-dismissible fade show`;
    alerta.role = 'alert';
    alerta.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
    `;
    
    const contenedor = document.querySelector('main .container');
    contenedor.insertBefore(alerta, contenedor.firstChild);
    
    // Desaparecer después de 5 segundos
    setTimeout(() => {
        if (alerta) {
            const bsAlert = new bootstrap.Alert(alerta);
            bsAlert.close();
        }
    }, 5000);
}

// Formatear fecha
function formatearFecha(fecha) {
    if (!fecha) return '';
    const opciones = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(fecha).toLocaleDateString('es-ES', opciones);
}
