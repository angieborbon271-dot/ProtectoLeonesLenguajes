// provincias.js
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const formProvincia = document.getElementById('form-provincia');
    const tbodyProvincias = document.getElementById('tbody-provincias');
    const btnGuardar = document.querySelector('#form-provincia button[type="submit"]');
    let provincias = [];

    // Cargar provincias al iniciar
    cargarProvincias();

    // Evento para guardar provincia
    formProvincia.addEventListener('submit', function(e) {
        e.preventDefault();
        guardarProvincia();
    });

    // Función para cargar las provincias
    async function cargarProvincias() {
        try {
            const response = await fetch('api/provincias.php');
            if (!response.ok) {
                throw new Error('Error al cargar las provincias');
            }
            provincias = await response.json();
            mostrarProvincias(provincias);
        } catch (error) {
            console.error('Error:', error);
            mostrarAlerta('Error al cargar las provincias', 'danger');
        }
    }

    // Función para mostrar las provincias en la tabla
    function mostrarProvincias(provincias) {
        tbodyProvincias.innerHTML = '';
        provincias.forEach(provincia => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${provincia.cod_provincia}</td>
                <td>${provincia.nombre_provincia}</td>
                <td>
                    <button class="btn btn-sm btn-warning me-2" onclick="editarProvincia(${provincia.cod_provincia})">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarProvincia(${provincia.cod_provincia})">Eliminar</button>
                </td>
            `;
            tbodyProvincias.appendChild(tr);
        });
    }

    // Función para guardar una nueva provincia o actualizar una existente
    async function guardarProvincia() {
        const codProvincia = document.getElementById('cod_provincia').value;
        const nombreProvincia = document.getElementById('nombre_provincia').value.trim();
        
        if (!nombreProvincia) {
            mostrarAlerta('Por favor ingrese el nombre de la provincia', 'warning');
            return;
        }

        const provincia = {
            cod_provincia: codProvincia || null,
            nombre_provincia: nombreProvincia
        };

        try {
            const url = codProvincia 
                ? `api/provincias.php?id=${codProvincia}`
                : 'api/provincias.php';
            
            const method = codProvincia ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(provincia)
            });

            if (!response.ok) {
                throw new Error('Error al guardar la provincia');
            }

            mostrarAlerta(`Provincia ${codProvincia ? 'actualizada' : 'creada'} correctamente`, 'success');
            formProvincia.reset();
            document.getElementById('cod_provincia').value = '';
            btnGuardar.textContent = 'Guardar';
            cargarProvincias();
        } catch (error) {
            console.error('Error:', error);
            mostrarAlerta('Error al guardar la provincia', 'danger');
        }
    }

    // Función para editar una provincia
    window.editarProvincia = async function(codProvincia) {
        try {
            const response = await fetch(`api/provincias.php?id=${codProvincia}`);
            if (!response.ok) {
                throw new Error('Error al cargar la provincia');
            }
            const provincia = await response.json();
            
            document.getElementById('cod_provincia').value = provincia.cod_provincia;
            document.getElementById('nombre_provincia').value = provincia.nombre_provincia;
            btnGuardar.textContent = 'Actualizar';
            
            // Hacer scroll al formulario
            document.getElementById('form-provincia').scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Error:', error);
            mostrarAlerta('Error al cargar la provincia para editar', 'danger');
        }
    };

    // Función para eliminar una provincia
    window.eliminarProvincia = async function(codProvincia) {
        if (!confirm('¿Está seguro de eliminar esta provincia?')) {
            return;
        }

        try {
            const response = await fetch(`api/provincias.php?id=${codProvincia}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Error al eliminar la provincia');
            }

            mostrarAlerta('Provincia eliminada correctamente', 'success');
            cargarProvincias();
        } catch (error) {
            console.error('Error:', error);
            mostrarAlerta('No se pudo eliminar la provincia. Asegúrese de que no tenga cantones asociados.', 'danger');
        }
    };

    // Función para mostrar alertas
    function mostrarAlerta(mensaje, tipo) {
        const alerta = document.createElement('div');
        alerta.className = `alert alert-${tipo} alert-dismissible fade show mt-3`;
        alerta.role = 'alert';
        alerta.innerHTML = `
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        const container = document.querySelector('main');
        container.insertBefore(alerta, container.firstChild);
        
        // Eliminar la alerta después de 5 segundos
        setTimeout(() => {
            alerta.remove();
        }, 5000);
    }
});
