const API_BASE = './api'; //Se tiene que cambiar si los HTML llegan a tener su propia carpeta como se hablo en la reunion del 1/12/25 

const provinciaSelect = document.getElementById('id_provincia');
const formProvincia = document.getElementById('form-provincia');
const tbodyProvincias = document.getElementById('tbody-provincias');


// cargar las provincias  
async function cargarProvincias() {
    try {
        const res = await fetch(`${API_BASE}/provincias.php`);
        if (!res.ok) throw new Error('Error al cargar provincias');

        const provincias = await res.json();

        provinciaSelect.innerHTML = '<option value="" selected disabled>Seleccione...</option>';

        provincias.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.COD_PROVINCIA;
            opt.textContent = p.NOMBRE_PROVINCIA;
            provinciaSelect.appendChild(opt);
        });
    } catch (err) {
        console.error(err);
        alert('No se pudieron cargar las provincias');
    }
}


provinciaSelect.addEventListener('change', () => {
    const codProvincia = provinciaSelect.value;
    cargarProvincias(codProvincia);
});

// listado provincias 
async function cargarProvincias() {
    try {
        const res = await fetch(`${API_BASE}/provincias.php`);
        if (!res.ok) throw new Error('Error al cargar provincias');
        const distritos = await res.json();
        tbodyProvincias.innerHTML = '';

        provincias.forEach(d => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${d.COD_PROVINCIA}</td>
                <td>${d.NOMBRE_PROVINCIA}</td>
                <td>
                    <button class="btn btn-sm btn-amarillo btn-editar" data-id="${d.COD_PROVINCIA}">Editar</button>
                    <button class="btn btn-sm btn-danger btn-eliminar" data-id="${d.COD_PROVINCIA}">Eliminar</button>
                </td>
            `;

            tbodyProvincias.appendChild(tr);
        });


        asignarEventosAcciones();
    } catch (err) {
        console.error(err);
        alert('No se pudieron cargar las provincias');
    }
}

//CRUD crear provincia
async function crearProvincia(e) {
    e.preventDefault();
    const cod_provincia = provinciaSelect.value;
    const nombre_provincia = document.getElementById('nombre_provincia').value.trim();

    if (!cod_provincia || !nombre_provincia) {
        alert('Complete todos los campos');
        return;
    }

    const payload = {
        accion: 'crear',
        cod_provincia,
        nombre_provincia
    };

    try {
        const res = await fetch(`${API_BASE}/provincias.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const respuesta = await res.json();
        if (!res.ok || respuesta.ok === false) {
            throw new Error(respuesta.mensaje || 'Error al crear provincia');
        }

        alert(respuesta.mensaje || 'Provincia creada correctamente');
        formProvincia.reset();
        
        cargarProvincias();
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}

formProvincia.addEventListener('submit', crearProvincia);

//CRUD delete provincia
function asignarEventosAcciones() {
    const botonesEliminar = document.querySelectorAll('.btn-eliminar');
    botonesEliminar.forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            if (!confirm('¿Desea eliminar esta povincia?')) return;
            const payload = {
                accion: 'eliminar',
                cod_provincia: id
            };

            try {
                const res = await fetch(`${API_BASE}/provincias.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const respuesta = await res.json();

                if (!res.ok || respuesta.ok === false) {
                    throw new Error(respuesta.mensaje || 'Error al eliminar provincia');
                }

                alert(respuesta.mensaje || 'Provincia eliminada correctamente');
                cargarProvincias();
            } catch (err) {
                console.error(err);
                alert(err.message);
            }
        });
    });


}

document.addEventListener('DOMContentLoaded', () => {
    cargarProvincias();
});
